import { ModelHook } from "./types";
import { ReactElement } from "react";

export function Executor<T>(props: {
  hook: () => ReturnType<ModelHook<T>>;
  onUpdate: (data: T) => void;
}) {
  //将属性方法都执行一次
  const data = props.hook();
  props.onUpdate(data);
  return null as ReactElement;
}
