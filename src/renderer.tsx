import ReactReconciler from "react-reconciler"; //这是一个用于创建自定义 React 渲染器的实验包。
import { ReactElement } from "react";

const hostConfig = {
  //使用自定义渲染器（可同时支持react-dom和react-native）
  now: Date.now,
  getRootHostContext: () => ({}),
  prepareForCommit: () => {},
  resetAfterCommit: () => {},
  getChildHostContext: () => ({}),
  shouldSetTextContent: () => true,
  createInstance: () => {},
  createTextInstance: () => {},
  appendInitialChild: () => {},
  appendChild: () => {},
  finalizeInitialChildren: () => {},
  supportsMutation: true,
  appendChildToContainer: () => {},
  prepareUpdate: () => true,
  commitUpdate: () => {},
  commitTextUpdate: () => {},
  removeChild: () => {}
};

const reconciler = ReactReconciler(hostConfig as any); //https://www.npmjs.com/package/react-reconciler

export function render(reactElement: ReactElement) {
  const container = reconciler.createContainer(null, false, false); //创建容器
  return reconciler.updateContainer(reactElement, container, null, null); //外部调用render时，传入元素，并放到容器中反复渲染
}
