## 结构

- dist：打包的文件
- examples：用于测试的代码
- flow：vue使用flow进行类型检查，此处定义静态类型
- script: rollup打包文件夹
- src: 主要的源码
  + compiler：模板解析，渲染相关的代码
  + core：核心代码，如生命周期，双向绑定等
  + platforms：对不同环境的支持
  + server：服务端渲染
  + sfc：vue文件解析
  + shared：通用的方法与变量
- test：测试文件夹

### 1、new Vue做了什么？
