import Resolver from '@forge/resolver';
import { fetchSprintData } from './resolver/index';

const resolver = new Resolver();
resolver.define('fetchSprintData', fetchSprintData);

export const run = async (event, context) => {
  // UI Kit entry — the frontend invokes the resolver directly
};
