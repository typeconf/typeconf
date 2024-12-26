export * from '../types/all.js'
export * from '@typeconf/sdk'

import * as values from './values.config.js'
import { writeConfigToFile } from '@typeconf/sdk'
writeConfigToFile(values, process.argv[2] ?? null);
