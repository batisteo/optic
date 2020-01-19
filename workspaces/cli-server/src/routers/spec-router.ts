import {getPathsRelativeToCwd, readApiConfig} from '@useoptic/cli-config';
import express from 'express';

import * as bodyParser from 'body-parser';
import * as path from 'path';
import * as fs from 'fs-extra';
import {FileSystemCaptureLoader} from '../file-system-session-loader';
import {developerDebugLogger} from '../logger';
import {ICliServerSession} from '../server';


export class CapturesHelpers {
  constructor(private basePath: string) {
  }

  async validateCaptureId(req: express.Request, res: express.Response, next: express.NextFunction) {
    const {captureId} = req.params;
    const captureDirectoryPath = this.captureDirectory(captureId);
    const exists = await fs.pathExists(captureDirectoryPath);
    if (exists) {
      return next();
    } else {
      return res.sendStatus(404);
    }
  }

  captureDirectory(captureId: string) {
    return path.join(this.basePath, captureId);
  }
}

export class ExampleRequestsHelpers {
  constructor(private basePath: string) {
  }

  exampleFile(requestId: string) {
    return path.join(this.basePath, requestId, 'examples.json');
  }

  async getExampleRequests(requestId: string): Promise<any> {
    const exampleFilePath = this.exampleFile(requestId);
    const currentFileContents = await (async () => {
      const exists = await fs.pathExists(exampleFilePath);
      if (exists) {
        try {
          const contents = await fs.readJson(exampleFilePath);
          return contents;
        } catch (e) {
          return [];
        }
      }
      return [];
    })();
    return currentFileContents;
  }

  async saveExampleRequest(requestId: string, example: any) {
    const exampleFilePath = this.exampleFile(requestId);
    const currentFileContents = await this.getExampleRequests(requestId);
    currentFileContents.push(example);
    await fs.ensureFile(exampleFilePath);
    await fs.writeJson(exampleFilePath, currentFileContents, {spaces: 2});
  }
}


export function makeRouter(sessions: ICliServerSession[]) {


  function prepareEvents(events: any): string {
    return `[
${events.map((x: any) => JSON.stringify(x)).join('\n,')}
]`;
  }

  async function ensureValidSpecId(req: express.Request, res: express.Response, next: express.NextFunction) {
    const {specId} = req.params;
    developerDebugLogger({specId, sessions});
    const session = sessions.find(x => x.id === specId);
    if (!session) {
      res.sendStatus(404);
      return;
    }

    const paths = await getPathsRelativeToCwd(session.path);
    const {capturesPath, exampleRequestsPath} = paths;
    const config = await readApiConfig();
    const capturesHelpers = new CapturesHelpers(capturesPath);
    const exampleRequestsHelpers = new ExampleRequestsHelpers(exampleRequestsPath);
    req.optic = {
      session,
      paths,
      config,
      capturesHelpers,
      exampleRequestsHelpers
    };
    next();
  }


  const router = express.Router({mergeParams: true});
  router.use(ensureValidSpecId);

  // events router
  router.get('/events', async (req, res) => {
    try {
      const events = await fs.readJson(req.optic.paths.specStorePath);
      res.json(events);
    } catch (e) {
      res.json([]);
    }
  });
  router.put('/events', bodyParser.json({limit: '100mb'}), async (req, res) => {
    const events = req.body;
    await fs.writeFile(req.optic.paths.specStorePath, prepareEvents(events));
    res.sendStatus(204);
  });

  // example requests router
  router.post('/example-requests/:requestId', bodyParser.json({limit: '100mb'}), async (req, res) => {
    const {requestId} = req.params;
    await req.optic.exampleRequestsHelpers.saveExampleRequest(requestId, req.body);
    res.sendStatus(204);
  });

  router.get('/example-requests/:requestId', async (req, res) => {
    const {requestId} = req.params;
    const currentFileContents = await req.optic.exampleRequestsHelpers.getExampleRequests(requestId);
    res.json({
      examples: currentFileContents
    });
  });

  // captures router. cli picks captureId and writes to whatever persistence method and provides capture id to ui. api spec just shows spec?
  router.get('/captures', async (req, res) => {
    const {captureIds} = req.optic.session;
    res.json({
      captures: captureIds
    });
  });
  router.get('/captures/:captureId/samples', async (req, res) => {
    const {captureId} = req.params;
    const loader = new FileSystemCaptureLoader({
      captureBaseDirectory: req.optic.paths.capturesPath
    });
    try {
      const capture = await loader.load(captureId);
      res.json({
        samples: capture.samples,
        links: [
          {rel: 'next', href: ''}
        ]
      });
    } catch (e) {
      res.sendStatus(500);
    }
  });

  //config
  router.get('/config', async (req, res) => {
    res.json(req.optic.config);
  });

  router.put('/config', bodyParser.json({limit: '2mb'}), async (req, res) => {
    await fs.writeFile(req.optic.paths.configPath, req.body.yaml);
    res.sendStatus(200);
  });

  return router;
}
