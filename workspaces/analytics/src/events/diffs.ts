import { DescribeEvent, RegisteredEvent } from '../interfaces/RegisterEvent';
import { Events } from '../interfaces/Events';
// @ts-ignore
import * as Joi from '@hapi/joi';
import 'joi-extract-type';

// Sent whenever an API is created
const UserChangedCaptureOverviewTabSchema = Joi.object({
  currentTab: Joi.string().required(),
  diffCount: Joi.number().required(),
  undocumentedUrlCount: Joi.number().required(),
});
type UserChangedCaptureOverviewTabProperties = Joi.extractType<
  typeof UserChangedCaptureOverviewTabSchema
>;
export const UserChangedCaptureOverviewTab = DescribeEvent<
  UserChangedCaptureOverviewTabProperties
>(
  Events.UserChangedCaptureOverviewTab,
  UserChangedCaptureOverviewTabSchema,
  (props) =>
    `User changed to ${props.currentTab} and there are ${props.diffCount} diffs + ${props.undocumentedUrlCount} undocumented urls`
);

const NewBodyDiffRenderedSchema = Joi.object({
  requestCount: Joi.number().required(),
  responseCount: Joi.number().required(),
  regions: Joi.array().required().items(Joi.string()),
});
type NewBodyDiffRenderedProperties = Joi.extractType<
  typeof NewBodyDiffRenderedSchema
>;
export const NewBodyDiffRendered = DescribeEvent<NewBodyDiffRenderedProperties>(
  Events.NewBodyDiffRendered,
  NewBodyDiffRenderedSchema,
  (props) => `Diff was rendered in regions ${props.regions.join(', \n')}`
);

const InferPolymorphismEnabledSchema = Joi.object({
  captureId: Joi.string().required(),
  endpointId: Joi.string().required(),
});
type InferPolymorphismEnabledProperties = Joi.extractType<
  typeof InferPolymorphismEnabledSchema
>;
export const UserEnabledInferPolymorphism = DescribeEvent<
  InferPolymorphismEnabledProperties
>(
  Events.UserEnabledInferPolymorphism,
  InferPolymorphismEnabledSchema,
  (props) =>
    `Infer Polymorphism was turned on for ${props.captureId}, endpoint ${props.endpointId}`
);

const UserBeganAddingNewUrlSchema = Joi.object({
  captureId: Joi.string().required(),
  method: Joi.string().required(),
  path: Joi.string().required(),
  knownPathId: Joi.string().optional(),
});
type UserBeganAddingNewUrlProperties = Joi.extractType<
  typeof UserBeganAddingNewUrlSchema
>;
export const UserBeganAddingNewUrl = DescribeEvent<
  UserBeganAddingNewUrlProperties
>(
  Events.UserBeganAddingNewUrl,
  UserBeganAddingNewUrlSchema,
  (props) =>
    `User Began Adding New Url ${props.method} ${props.path} in ${props.captureId}`
);

const UserFinishedAddingNewUrlSchema = Joi.object({
  purpose: Joi.string().required(),
  captureId: Joi.string().required(),
  method: Joi.string().required(),
  pathExpression: Joi.string().optional(),
});
type UserFinishedAddingNewUrlProperties = Joi.extractType<
  typeof UserFinishedAddingNewUrlSchema
>;
export const UserFinishedAddingNewUrl = DescribeEvent<
  UserFinishedAddingNewUrlProperties
>(
  Events.UserFinishedAddingNewUrl,
  UserFinishedAddingNewUrlSchema,
  (props) =>
    `User Added New Url ${props.method} ${props.pathExpression} in ${props.captureId} with purpose '${props.pathExpression}'`
);

const SuggestionAcceptedSchema = Joi.object({
  captureId: Joi.string().required(),
  suggestion: Joi.string().required(),
});
type SuggestionAcceptedProperties = Joi.extractType<
  typeof SuggestionAcceptedSchema
>;
export const UserAcceptedSuggestion = DescribeEvent<
  SuggestionAcceptedProperties
>(
  Events.UserAcceptedSuggestion,
  SuggestionAcceptedSchema,
  (props) => `Suggestion to '${props.suggestion}' was accepted`
);

const UserPreviewedSuggestionSchema = Joi.object({
  captureId: Joi.string().required(),
  diff: Joi.string().required(),
  diffAssertion: Joi.string().required(),
  suggestion: Joi.string().required(),
});
type UserPreviewedSuggestionProperties = Joi.extractType<
  typeof UserPreviewedSuggestionSchema
>;
export const UserPreviewedSuggestion = DescribeEvent<
  UserPreviewedSuggestionProperties
>(
  Events.UserPreviewedSuggestion,
  UserPreviewedSuggestionSchema,
  (props) =>
    `Suggestion to '${props.suggestion}' was previewed in response to diff: ${props.diff}`
);

const UserResetDiffSchema = Joi.object({});
type UserResetDiffProperties = Joi.extractType<typeof UserResetDiffSchema>;
export const UserResetDiff = DescribeEvent<UserResetDiffProperties>(
  Events.UserResetDiff,
  UserResetDiffSchema,
  (props) => `The Diff Was Reset`
);

const UserCommittedChangesSchema = Joi.object({
  message: Joi.string().required(),
  captureId: Joi.string().required(),
  suggestions: Joi.number().required(),
});
type UserCommittedChangesProperties = Joi.extractType<
  typeof UserCommittedChangesSchema
>;
export const UserCommittedChanges = DescribeEvent<
  UserCommittedChangesProperties
>(
  Events.UserCommittedChanges,
  UserCommittedChangesSchema,
  (props) => `The Diff Was Reset`
);
