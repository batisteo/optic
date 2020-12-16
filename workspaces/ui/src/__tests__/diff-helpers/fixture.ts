import { makeUniverse } from './universes/makeUniverse';
import { DiffSet } from '../../engine/diff-set';
import { ParsedDiff } from '../../engine/parse-diff';
import path from 'path';
import colors from 'colors';
import { DiffRfcBaseState } from '../../engine/interfaces/diff-rfc-base-state';
import {
  ExampleCaptureService,
  ExampleDiffService,
} from '../../services/diff/ExampleDiffService';
import { IShapeTrail } from '../../engine/interfaces/shape-trail';
import {
  prepareNewRegionDiffSuggestionPreview,
  prepareShapeDiffSuggestionPreview,
} from '../../engine/interpretors/prepare-diff-previews';
import {
  IChangeType,
  ICopy,
  ICopyStyle,
  IDiffSuggestionPreview,
  ISuggestion,
} from '../../engine/interfaces/interpretors';
import { spawn, Thread, Worker } from 'threads';
import { JsonHelper, opticEngine, RfcCommandContext } from '@useoptic/domain';

interface ITestUniverse {
  rfcBaseState: DiffRfcBaseState;
  diffs: DiffSet;
  diffService: ExampleDiffService;
  captureService: ExampleCaptureService;
}

export async function loadsDiffsFromUniverse(
  path: string
): Promise<ITestUniverse> {
  const universe_raw = require(path);
  const universePromise = makeUniverse(universe_raw);
  const { captureService, diffService, rfcBaseState } = await universePromise;
  const diffsRaw = (await diffService.listDiffs()).rawDiffs;

  const diffs = new DiffSet(
    diffsRaw.map(([diff, interactions]) => {
      const diffParsed = new ParsedDiff(diff, interactions);
      return diffParsed;
    }),
    rfcBaseState
  );

  return {
    diffs,
    captureService,
    diffService,
    rfcBaseState,
  };
}

export const testCase = (basePath: string) => async (
  name: string
): Promise<ITestUniverse> => {
  return await loadsDiffsFromUniverse(
    path.join(__dirname + '/universes', basePath, name + '.json')
  );
};

export async function shapeDiffPreview(
  input: {
    shapeDiffGroupingHash: string;
    shapeTrail: IShapeTrail;
    diffs: ParsedDiff[];
  },
  universe: ITestUniverse
): Promise<IDiffSuggestionPreview> {
  const { pathId, method } = input.diffs[0].location(universe.rfcBaseState);

  const trailValues = await universe.diffService.learnTrailValues(
    universe.rfcBaseState.rfcService,
    universe.rfcBaseState.rfcId,
    pathId,
    method,
    { [input.diffs[0]!.diffHash]: input.diffs[0]!.raw() }
  );
  return await prepareShapeDiffSuggestionPreview(
    input.diffs[0],
    universe,
    trailValues[input.diffs[0]!.diffHash],
    []
  );
}

export async function canApplySuggestions(
  suggestions: ISuggestion[],
  universe: ITestUniverse
) {
  function handleCommands(commands: any[], eventString: string): any[] {
    const {
      universeFromEventsAndAdditionalCommands,
    } = require('@useoptic/domain-utilities');

    const {
      StartBatchCommit,
      EndBatchCommit,
    } = opticEngine.com.useoptic.contexts.rfc.Commands;

    const inputCommands = JsonHelper.vectorToJsArray(
      opticEngine.CommandSerialization.fromJs(commands)
    );

    const commandContext = new RfcCommandContext(
      'clientId',
      'clientSessionId',
      'batchId'
    );

    const {
      rfcId,
      eventStore,
    } = universeFromEventsAndAdditionalCommands(
      JSON.parse(eventString),
      commandContext,
      [
        StartBatchCommit('batchId', 'commitMessage'),
        ...inputCommands,
        EndBatchCommit('batchId'),
      ]
    );

    return JSON.parse(eventStore.serializeEvents(rfcId));
  }

  const events = universe.rfcBaseState.eventStore.serializeEvents(
    universe.rfcBaseState.rfcId
  );

  return Promise.all(
    suggestions.map(async (i) => {
      const commands = i.commands;
      try {
        return handleCommands(commands, events).map((i) => {
          i[Object.keys(i)[0]].eventContext = null;
          return i;
        });
      } catch (e) {
        throw new Error(
          'Count not apply commands for ' +
            e +
            '\n' +
            ICopyToConsole(i.action.activeTense) +
            '\n' +
            JSON.stringify(commands, null, 4)
        );
      }
    })
  );
}

export async function newRegionPreview(
  diff: ParsedDiff,
  universe: ITestUniverse
): Promise<IDiffSuggestionPreview> {
  const { pathId, method } = diff.location(universe.rfcBaseState);

  const initial = await universe.diffService.learnInitial(
    universe.rfcBaseState.rfcService,
    universe.rfcBaseState.rfcId,
    pathId,
    method,
    universe.rfcBaseState.domainIdGenerator
  );

  return await prepareNewRegionDiffSuggestionPreview(
    diff,
    universe,
    initial,
    []
  );
}

export function ICopyToConsole(i: ICopy[]): string {
  return i
    .map((i) =>
      i.style === ICopyStyle.Code ? colors.bgBlue(i.text) : colors.green(i.text)
    )
    .join(' ');
}

export async function logResult(preview: IDiffSuggestionPreview) {
  const toLog = [];

  toLog.push(
    `TITLE: ${colors.underline(
      ICopyToConsole(preview.overrideTitle || preview.diffDescription.title)
    )}`
  );

  toLog.push(
    `ASSERTION: ${colors.underline(
      ICopyToConsole(preview.diffDescription.assertion)
    )}`
  );
  toLog.push(
    `CHANGE TYPE: ${colors.underline(
      IChangeType[preview.diffDescription.changeType]
    )}`
  );

  preview.suggestions.map((i, index) => {
    toLog.push(
      `SUGGESTION ${index}: ${colors.underline(
        ICopyToConsole(i.action.activeTense)
      )}`
    );
    toLog.push(JSON.stringify(i.commands, null, 2));
    toLog.push('-----------------');
  });

  console.log(toLog.join('\n'));
}
