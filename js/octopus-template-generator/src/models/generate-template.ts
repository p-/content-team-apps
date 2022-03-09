import {Entity, model, property} from '@loopback/repository';

@model()
export class GenerateTemplate extends Entity {
  @property() data: {

    type: string;

    attributes: {
      generator: string,
      options: {[key: string]: string;}
    }
  }

  constructor(data?: Partial<GenerateTemplate>) {
    super(data);
  }
}
