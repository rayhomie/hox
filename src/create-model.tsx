import { ModelHook, UseModel } from "./types";
import { Container } from "./container";
import { Executor } from "./executor";
import React, { useEffect, useRef, useState } from "react";
import { render } from "./renderer";

export function createModel<T, P>(hook: ModelHook<T, P>, hookArg?: P) {
  const container = new Container(hook); //实例化容器（可订阅发布操作）
  render(
    //将元素在渲染器中渲染（模拟react-dom和react-native）
    <Executor
      onUpdate={val => {
        container.data = val; //将外部hook执行后的返回值加入到容器中（即全局store对象）
        container.notify(); //将订阅的方法都执行一次
      }}
      hook={() => hook(hookArg)} //执行外部传入的hook，并将返回值传给onUpdate进行执行
    />
  );
  //自定义hook将会被返回（用于让用户获取全局状态）
  const useModel: UseModel<T> = depsFn => {
    //depsFn: model => [model.count, model.x.y]
    const [state, setState] = useState<T | undefined>(() =>
      container ? container.data : undefined
    ); //用于去容器中的全局状态
    const depsFnRef = useRef(depsFn); //支持传入一个 `depsFn` 函数，来精确控制订阅的字段（性能优化）
    depsFnRef.current = depsFn; //暂存依赖函数
    const depsRef = useRef<unknown[]>(
      depsFnRef.current?.(container.data) || [] //将全局状态store对象作为参数，执行依赖函数（找出在store对象中的依赖属性作为depsRef来缓存）
    );

    useEffect(() => {
      if (!container) return;
      function subscriber(val: T) {
        if (!depsFnRef.current) {
          setState(val);
        } else {
          const oldDeps = depsRef.current;
          const newDeps = depsFnRef.current(val);
          if (compare(oldDeps, newDeps)) {
            setState(val);
          }
          depsRef.current = newDeps;
        }
      }
      container.subscribers.add(subscriber);
      return () => {
        container.subscribers.delete(subscriber);
      };
    }, [container]);
    return state!;
  };
  Object.defineProperty(useModel, "data", {
    get: function() {
      return container.data;
    }
  });
  return useModel;
}

export function createLazyModel<T, P>(hook: ModelHook<T, P>, hookArg?: P) {
  let useModel: UseModel<T>;
  const useLazyModel: UseModel<T> = depsFn => {
    if (!useModel) {
      useModel = createModel(hook, hookArg);
    }
    return useModel(depsFn);
  };
  Object.defineProperty(useLazyModel, "data", {
    get: function() {
      return useModel?.data;
    }
  });
  return useLazyModel;
}

function compare(oldDeps: unknown[], newDeps: unknown[]) {
  if (oldDeps.length !== newDeps.length) {
    return true;
  }
  for (const index in newDeps) {
    if (oldDeps[index] !== newDeps[index]) {
      return true;
    }
  }
  return false;
}
