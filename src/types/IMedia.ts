import {Document} from 'mongoose'
export interface IMedia{
    url: string;
    type: "image" | "video";
  }