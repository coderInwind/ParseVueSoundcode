/* @flow */

import { noop, extend } from "shared/util";
import { warn as baseWarn, tip } from "core/util/debug";
import { generateCodeFrame } from "./codeframe";

type CompiledFunctionResult = {
  render: Function,
  staticRenderFns: Array<Function>,
};

function createFunction(code, errors) {
  try {
    return new Function(code);
  } catch (err) {
    errors.push({ err, code });
    return noop;
  }
}

export function createCompileToFunctionFn(compile: Function): Function {
  // 闭包缓存
  const cache = Object.create(null);
  // 包装rander函数
  return function compileToFunctions(
    template: string,
    options?: CompilerOptions,
    vm?: Component
  ): CompiledFunctionResult {
    // 首先将 options 拷贝一份到新的对象上
    options = extend({}, options);
    // 定义警告函数
    const warn = options.warn || baseWarn;
    delete options.warn;

    // csp警告
    if (process.env.NODE_ENV !== "production") {
      // detect possible CSP restriction
      try {
        new Function("return 1");
      } catch (e) {
        if (e.toString().match(/unsafe-eval|CSP/)) {
          warn(
            "It seems you are using the standalone build of Vue.js in an " +
              "environment with Content Security Policy that prohibits unsafe-eval. " +
              "The template compiler cannot work in this environment. Consider " +
              "relaxing the policy to allow unsafe-eval or pre-compiling your " +
              "templates into render functions."
          );
        }
      }
    }

    // 如果有自定义的delimiters(插值符号，默认为"{{}}")
    // 将符号拼接到前面，没有就不拼接
    const key = options.delimiters
      ? String(options.delimiters) + template
      : template;
    // 进行缓存
    if (cache[key]) {
      return cache[key];
    }

    // 编译结果
    const compiled = compile(template, options);

    // 错误和提示处理
    if (process.env.NODE_ENV !== "production") {
      if (compiled.errors && compiled.errors.length) {
        if (options.outputSourceRange) {
          compiled.errors.forEach((e) => {
            warn(
              `Error compiling template:\n\n${e.msg}\n\n` +
                generateCodeFrame(template, e.start, e.end),
              vm
            );
          });
        } else {
          warn(
            `Error compiling template:\n\n${template}\n\n` +
              compiled.errors.map((e) => `- ${e}`).join("\n") +
              "\n",
            vm
          );
        }
      }
      if (compiled.tips && compiled.tips.length) {
        if (options.outputSourceRange) {
          compiled.tips.forEach((e) => tip(e.msg, vm));
        } else {
          compiled.tips.forEach((msg) => tip(msg, vm));
        }
      }
    }

    // 转为函数
    const res = {};
    const fnGenErrors = [];

    res.render = createFunction(compiled.render, fnGenErrors);

    res.staticRenderFns = compiled.staticRenderFns.map((code) => {
      return createFunction(code, fnGenErrors);
    });

    // check function generation errors.
    // this should only happen if there is a bug in the compiler itself.
    // mostly for codegen development use
    /* istanbul ignore if */
    if (process.env.NODE_ENV !== "production") {
      if ((!compiled.errors || !compiled.errors.length) && fnGenErrors.length) {
        warn(
          `Failed to generate render function:\n\n` +
            fnGenErrors
              .map(({ err, code }) => `${err.toString()} in\n\n${code}\n`)
              .join("\n"),
          vm
        );
      }
    }

    return (cache[key] = res);
  };
}
