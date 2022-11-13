import { DEL_FLAG } from "@common/enum";

export interface Tag {
  id: number;
  tag_name: string;
  tag_description: string;
  del_flag: DEL_FLAG;
}
