开发几个功能：

1.server 酱通知，独立模块，只接收 title，每次被执行的时候，检查最近 1 小时内是否发送过同类型信息（title 是否一样），发送给则忽略本次，sendKey从.env 中读取，发送结果不管，都当作成功
2.delete 接口
增加一个全局是否可删除状态，canDelete 默认 true

{"title":"成功：编辑稿件：xxxxx2026.01.13 02.15","dir":"xxx"}
{"title":"失败：编辑稿件：xxxxx2026.01.13 02.15","dir":"xxx"}
{"title":"成功：同步任务: 2026-01-13 02-20-12 随便播播.mp4","dir":"xxx"}
{"title":"失败：同步任务: 2026-01-13 02-20-12 随便播播.mp4","dir":"xxx"}

以上是会接收到的 body 数据示例，格式是  {"title":"<state>：<task_type>: <file_name>","dir":"<dir>"}，file_name 可能有扩展名，可能没有

- canDelete 为 false，发送一次 server 酱通知，title: 删除任务暂停中，结束处理
- 当收到 state 不是成功的时候，设置 canDelete 为 false，然后发送一次 server 酱通知，title: 录制任务失败，结束处理，记录日志（xxx任务失败,暂停删除）
- 接收到 同步任务 时（此时state 已经能确定是 成功），校验文件扩展名是否为 mp4
  - 非 mp4 忽略，结束处理
  - mp4：搜索 dir 下所有文件（多层文件夹），找到同名的文件，等待 2 min，检查文件是否被锁定，未使用则进行删除，被锁定则结束处理，记录日志 xxx 删除成功/失败（失败原因）

2.del-continue 接口
不需要鉴权，调用后 canDelete 更新为 true,记录日志，删除功能开启