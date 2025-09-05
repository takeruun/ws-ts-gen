import * as yaml from 'js-yaml';
import { readFileSync } from 'fs';
import { AsyncAPIDocument } from '../types/asyncapi';

export class AsyncAPIParser {
  parse(filePath: string): AsyncAPIDocument {
    const fileContent = readFileSync(filePath, 'utf-8');
    const extension = filePath.split('.').pop()?.toLowerCase();
    
    let document: AsyncAPIDocument;
    
    if (extension === 'yaml' || extension === 'yml') {
      document = yaml.load(fileContent) as AsyncAPIDocument;
    } else if (extension === 'json') {
      document = JSON.parse(fileContent) as AsyncAPIDocument;
    } else {
      throw new Error(`Unsupported file format: ${extension}. Use .yaml, .yml, or .json`);
    }
    
    this.validate(document);
    return document;
  }
  
  private validate(doc: AsyncAPIDocument): void {
    if (!doc.asyncapi) {
      throw new Error('Missing asyncapi version');
    }
    if (!doc.info) {
      throw new Error('Missing info section');
    }
    if (!doc.channels) {
      throw new Error('Missing channels section');
    }
    if (!doc.components) {
      throw new Error('Missing components section');
    }
  }
}