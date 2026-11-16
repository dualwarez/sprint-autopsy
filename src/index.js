// Sprint Autopsy — Custom UI resolver backend
import Resolver from '@forge/resolver';
import { fetchSprintData } from './resolver/index';

const resolver = new Resolver();
resolver.define('fetchSprintData', fetchSprintData);

export const handler = resolver.getDefinitions();
