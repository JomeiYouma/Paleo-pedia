import fs from 'fs';
import { getYearForSort } from './src/utils/helpers.js';

const sql = fs.readFileSync('dump.sql', 'utf8');
const lines = sql.split('\n');

const regex = /INSERT INTO `cartels`.*?VALUES[\s\S]*?(?=INSERT INTO `cartels`|--|$)/gi;
let match;
const cartels = [];
// This is a naive regex matching the values.
// We can just extract all lines looking like ('uuid', ..., 'annee', ...)
