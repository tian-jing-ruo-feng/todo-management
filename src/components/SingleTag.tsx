import { Tag } from "antd";

export interface SingleTagProps {

  color: string;

  id: string;

  children: React.ReactNode;

}

const SingleTag = (props: SingleTagProps) => {
  return (
    <Tag color={props.color} key={props.id}>{props.children}</Tag>
  );
};

export default SingleTag;