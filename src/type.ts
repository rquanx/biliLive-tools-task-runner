export type CommonRoomConfig = {
  open: boolean
  minSize: number
  /** 视频标题 */
  title: string
  uploadPresetId?: string
  danmu: boolean
  ffmpegPreset?: string | null
  danmuPreset?: string | null
  autoPartMerge: boolean
  partMergeMinute?: number
  uid?: number
  /** 生成高能进度条 */
  hotProgress: boolean
  /** 使用直播封面 */
  useLiveCover: boolean
  /** 高能进度条：采样间隔 */
  hotProgressSample?: number
  /** 高能进度条：高度 */
  hotProgressHeight?: number
  /** 高能进度条：默认颜色 */
  hotProgressColor?: string
  /** 高能进度条：覆盖颜色 */
  hotProgressFillColor?: string
  /** 转封装为mp4 */
  convert2Mp4?: boolean
  /** 转封装后删除源文件 */
  removeSourceAferrConvert2Mp4?: boolean
  /** 压制完成后的操作 */
  afterConvertAction?: Array<'removeVideo' | 'removeXml'>
  /** 限制只在某一段时间处理视频 */
  limitVideoConvertTime?: boolean
  /** 允许视频处理时间 */
  videoHandleTime: [string, string]
  /** 上传完成后删除操作 */
  afterUploadDeletAction?: 'none' | 'delete' | 'deleteAfterCheck'
  /** 限制只在某一段时间上传 */
  limitUploadTime?: boolean
  /** 允许上传处理时间 */
  uploadHandleTime: [string, string]
  /** 分p标题模板 */
  partTitleTemplate: string
  /** 同步器配置ID */
  syncId?: string | null

  // 上传非弹幕版选项
  uploadNoDanmu?: boolean
  // 上传非视频版预设
  noDanmuVideoPreset?: string
}

// webhook房间配置
export type AppRoomConfig = {
  remark?: string
  /**不为全局配置的选项 */
  noGlobal?: string[]
} & CommonRoomConfig

// 录制全局配置
export interface GlobalRecorder {
  /** 保存根目录 */
  savePath: string
  /** 命名规则 */
  nameRule: string
  /** 自动录制 */
  autoRecord: boolean
  /** 检查间隔 */
  checkInterval: number
  /** 并发数 */
  maxThreadCount: number
  /** 等待时间 */
  waitTime: number
  /** 废弃：调试模式 */
  debugMode: boolean
  /** 调试等级 */
  debugLevel: 'none' | 'basic' | 'verbose'
  /** 下播延迟检查 */
  recordRetryImmediately: boolean
  /** 画质 */
  quality: 'lowest' | 'low' | 'medium' | 'high' | 'highest'
  /** 线路 */
  line?: string
  /** 录制弹幕 */
  disableProvideCommentsWhenRecording?: boolean
  /** 保存礼物弹幕 */
  saveGiftDanma?: boolean
  /** 保存高能弹幕 */
  saveSCDanma?: boolean
  /** 弹幕是否使用服务端时间戳 */
  useServerTimestamp: boolean
  /**分段时长，单位分钟 */
  segment?: string
  /** 账号 */
  uid?: number
  /** 保存封面 */
  saveCover?: boolean
  /** 画质匹配重试次数 */
  qualityRetry: number
  /** 视频格式 */
  videoFormat: 'auto' | 'ts' | 'mkv'
  /** 支持的录制器 */
  recorderType: 'auto' | 'ffmpeg' | 'mesio' | 'bililive'
  /** 保存弹幕测试 */
  saveDanma2DB: boolean
  /** B站特有的配置 */
  bilibili: any
  /** 斗鱼特有的配置 */
  douyu: any
  /** 虎牙特有的配置 */
  huya: any
  /** 抖音特有的配置 */
  douyin: any
}

export type SyncType = 'baiduPCS' | 'aliyunpan' | 'alist' | 'pan123' | 'copy'

export type SyncConfig = {
  id: string
  name: string
  syncSource: SyncType
  folderStructure: string
  targetFiles: ('source' | 'danmaku' | 'xml' | 'cover')[]
  stringFilters?: 'filterFourByteChars'[]
}

export const recorderNoGlobalFollowFields: Array<
  Exclude<
    keyof Recorder,
    | 'providerId'
    | 'id'
    | 'channelId'
    | 'remarks'
    | 'extra'
    | 'disableAutoCheck'
    | 'sendToWebhook'
    | 'streamPriorities'
    | 'sourcePriorities'
    | 'noGlobalFollowFields'
    | 'line'
    | 'titleKeywords'
    | 'liveStartNotification'
    | 'liveEndNotification'
    | 'onlyAudio'
    | 'handleTime'
    | 'weight'
  >
> = [
  'disableProvideCommentsWhenRecording',
  'saveGiftDanma',
  'saveSCDanma',
  'segment',
  'uid',
  'saveCover',
  'qualityRetry',
  'formatName',
  'useM3U8Proxy',
  'codecName',
  'source',
  'videoFormat',
  'recorderType',
  'cookie',
  'doubleScreen',
  'useServerTimestamp',
]

export type NotificationTaskStatus = 'success' | 'failure'

export interface Recorder {
  providerId: 'DouYu' | 'HuYa' | 'Bilibili' | 'DouYin'
  id: string
  channelId: string
  remarks?: string
  streamPriorities: any[]
  sourcePriorities: any[]
  extra: {
    createTimestamp?: number
    /** B站主播的uid，抖音的sec_uid */
    recorderUid?: number | string
    /** 头像 */
    avatar?: string
    lastRecordTime?: number | null
  }
  disableAutoCheck?: boolean
  /** 发送至发送至软件webhook */
  sendToWebhook?: boolean
  /** 线路，尚未使用 */
  line?: string
  /** 录制弹幕 */
  disableProvideCommentsWhenRecording?: boolean
  /** 保存礼物弹幕 */
  saveGiftDanma?: boolean
  /** 弹幕是否使用服务端时间戳 */
  useServerTimestamp: boolean
  /** 保存高能弹幕 */
  saveSCDanma?: boolean
  /**分段时长，单位分钟 */
  segment?: string
  /** 账号 */
  uid?: number | string
  /** 保存封面 */
  saveCover?: boolean
  /** 视频格式 */
  videoFormat: GlobalRecorder['videoFormat']
  /** 录制器类型 */
  recorderType: GlobalRecorder['recorderType']
  qualityRetry: GlobalRecorder['qualityRetry']
  formatName: GlobalRecorder['bilibili']['formatName']
  useM3U8Proxy: GlobalRecorder['bilibili']['useM3U8Proxy']
  codecName: GlobalRecorder['bilibili']['codecName']
  source: GlobalRecorder['douyu']['source']
  /** 标题关键词，如果直播间标题包含这些关键词，则不会自动录制（仅对斗鱼有效），多个关键词用英文逗号分隔 */
  titleKeywords?: string
  /** 开播推送 */
  liveStartNotification?: boolean
  /** 录制结束通知 */
  liveEndNotification?: boolean
  /** 权重 */
  weight: number
  /** 抖音cookie */
  cookie?: string
  /** 是否使用双屏直播流 */
  doubleScreen?: boolean
  /** 流格式优先级 */
  // formatPriorities: Array<"flv" | "hls">;
  /** 只录制音频 */
  onlyAudio?: boolean
  /** 监控时间段 */
  handleTime: [string | null, string | null]
  /** 调试等级 */
  debugLevel: 'none' | 'basic' | 'verbose'
  /** API类型，仅抖音 */
  api: any
  // 不跟随全局配置字段
  noGlobalFollowFields: typeof recorderNoGlobalFollowFields
}

/**
 * 自定义HTTP通知配置
 */
export interface NotificationCustomHttpConfig {
  /** 请求URL */
  url: string
  /** 请求方法 */
  method?: 'GET' | 'POST' | 'PUT'
  /** 请求体，支持{{title}}和{{desc}}占位符 */
  body?: string
  /** 请求头，每行一个，格式为key: value */
  headers?: string
}

// 工具页配置
export type ToolConfig = {
  /** 主页 */
  home: {
    /** 上传预设 */
    uploadPresetId: string
    /** 弹幕转换预设 */
    danmuPresetId: string
    /** ffmpeg预设 */
    ffmpegPresetId: string
    /** 完成后移除源文件 */
    removeOrigin: boolean
    /** 完成后自动上传 */
    autoUpload: boolean
    /** 审核通过后删除源文件 */
    removeOriginAfterUploadCheck: boolean
    /** 高能进度条 */
    hotProgress: boolean
    /** 采样间隔 */
    hotProgressSample: number
    /** 高度 */
    hotProgressHeight: number
    /** 默认颜色 */
    hotProgressColor: string
    /** 覆盖颜色 */
    hotProgressFillColor: string
  }
  /** 翻译配置 */
  translate: {
    presetId?: string
  }
  /** 上传配置 */
  upload: {
    /** 上传预设 */
    uploadPresetId: string
    /** 审核通过后删除源文件 */
    removeOriginAfterUploadCheck: boolean
  }
  /** 弹幕转换配置 */
  danmu: {
    /** 弹幕转换预设 */
    danmuPresetId: string
    /** 保存类型 */
    saveRadio: 1 | 2
    /** 保存路径 */
    savePath: string
    /** 完成后移除源文件 */
    removeOrigin: boolean
    /** 覆盖已存在的文件 */
    override: boolean
  }
  video2mp4: {
    /** 保存类型 */
    saveRadio: 1 | 2
    /** 保存路径 */
    savePath: string
    /** 保留源文件 */
    saveOriginPath: boolean
    /** 覆盖已存在的文件 */
    override: boolean
    /** 完成后移除源文件 */
    removeOrigin: boolean
    /** ffmpeg预设 */
    ffmpegPresetId: string
    /** 弹幕预设 */
    danmuPresetId: string
    /** 高能进度条 */
    hotProgress: boolean
  }
  videoMerge: {
    /** 保存到原始文件夹 */
    saveOriginPath: boolean
    /** 完成后移除源文件 */
    removeOrigin: boolean
    /** 保留元数据 */
    keepFirstVideoMeta: boolean
    /** 合并弹幕 */
    mergeXml: boolean
  }
  flvRepair: {
    /** 修复器 */
    type: 'bililive' | 'mesio'
    /** 保存类型 */
    saveRadio: 1 | 2
    /** 保存路径 */
    savePath: string
  }
  /** 下载页 */
  download: {
    /** 保存路径 */
    savePath: string
    /** 弹幕参数 */
    danmu: 'none' | 'xml'
    /** 斗鱼下载分辨率 */
    douyuResolution: 'highest' | string
    /** 下载时覆盖已有文件 */
    override: boolean
    /** 只下载音频 */
    onlyAudio: boolean
    /** 只下载弹幕 */
    onlyDanmu: boolean
  }
  /** 切片 */
  videoCut: {
    /** 保存类型 */
    saveRadio: 1 | 2
    /** 保存路径 */
    savePath: string
    /** 覆盖已存在的文件 */
    override: boolean
    /** ffmpeg预设 */
    ffmpegPresetId: string
    /** 标题 */
    title: string
    /** 弹幕预设 */
    danmuPresetId: string
    /** 忽略弹幕 */
    ignoreDanmu: boolean
  }
  /** 文件同步 */
  fileSync: {
    /** 完成后移除源文件 */
    removeOrigin: boolean
    /** 同步类型 */
    syncType?: AppConfig['sync']['syncConfigs'][number]['syncSource']
    /** 目标路径 */
    targetPath: string
  }
}

export interface AppConfig {
  logLevel: any
  /** 允许自定义可执行文件地址 */
  customExecPath: boolean
  ffmpegPath: string
  ffprobePath: string
  danmuFactoryPath: string
  /** lossles-cut可执行路径 */
  losslessCutPath: string
  /** mesio 可执行路径 */
  mesioPath: string
  /** 录播姬引擎 可执行路径 */
  bililiveRecorderPath: string
  /** audiowaveform 可执行路径 */
  audiowaveformPath: string
  /** 缓存文件夹 */
  cacheFolder: string
  /** 保存到回收站 */
  trash: boolean
  /** 自动检查更新 */
  autoUpdate?: boolean
  /** 开机自启动 */
  autoLaunch: boolean
  /** 配置持久化 */
  saveConfig: boolean
  /** 最小化到任务栏 */
  minimizeToTray: boolean
  /** 关闭到任务栏 */
  closeToTray: boolean
  menuBarVisible: boolean
  port: number
  host: string
  passKey: string
  https?: boolean
  requestInfoForRecord: boolean
  biliUploadFileNameType: 'ask' | 'always' | 'never'
  cutPageInNewWindow: boolean
  webhook: {
    recoderFolder: string
    blacklist: string
    rooms: {
      [roomId: string]: AppRoomConfig
    }
  } & CommonRoomConfig
  /** 加密后的B站登录信息 */
  bilibiliUser: {
    [uid: number]: string
  }
  /** 当前使用的b站uid */
  uid?: number
  /** 工具页配置 */
  tool: ToolConfig
  /** 切片 */
  videoCut: {
    /** 自动保存 */
    autoSave: boolean
    /** 缓存波形图数据 */
    cacheWaveform: boolean
  }
  /** 通知配置 */
  notification: {
    /** 任务 */
    task: {
      ffmpeg: NotificationTaskStatus[]
      danmu: NotificationTaskStatus[]
      upload: NotificationTaskStatus[]
      download: NotificationTaskStatus[]
      douyuDownload: NotificationTaskStatus[]
      mediaStatusCheck: NotificationTaskStatus[]
      sync: NotificationTaskStatus[]
      diskSpaceCheck: {
        values: Array<'bilirecorder' | 'bililiveTools'>
        /** 磁盘空间不足阈值，单位GB */
        threshold: number
      }
    }
    /** 通知配置项 */
    setting: {
      // 通知类型，支持server酱和邮件
      type?: 'server' | 'mail' | 'tg' | 'system' | 'ntfy' | 'allInOne' | 'customHttp'
      // server酱key
      customHttp: NotificationCustomHttpConfig
    }
    taskNotificationType: {
      liveStart: AppConfig['notification']['setting']['type']
    }
  }
  // 同步
  sync: {
    baiduPCS: {
      execPath: string
    }
    aliyunpan: {
      execPath: string
    }
    alist: {
      apiUrl: string
      username: string
      hashPassword: string
      limitRate: number // KB
      retry: number
    }
    pan123: {
      clientId: string
      clientSecret: string
      limitRate: number // KB
    }
    syncConfigs: SyncConfig[]
  }
  /** 翻译配置 */
  llmPresets: {
    id: string
    type: 'ollama'
    ollama: {
      server: string
      model: string
    }
    /** 函数调用 */
    functionCall: boolean
    /** 自定义提示词 */
    prompt: string
    /** 上下文长度 */
    contextLength: number
    /** 无需翻译的词汇 */
    noTranslate: string
    /** 创造性 */
    temperature: number
  }[]
  /** 最大任务数 */
  task: {
    ffmpegMaxNum: number
    douyuDownloadMaxNum: number
    biliUploadMaxNum: number
    biliDownloadMaxNum: number
    syncMaxNum: number
  }
  /** 上传配置 */
  biliUpload: {
    /** 上传重试次数 */
    retryTimes: number
    /** 上传超时时间 */
    retryDelay: number
    /** 并发 */
    concurrency: number
    /** 上传限速 */
    limitRate: number
    /** 检查稿件间隔 */
    checkInterval: number
    /** 投稿最短间隔 */
    minUploadInterval: number
    /** 账号授权自动更新 */
    accountAutoCheck: boolean
    /** 使用必剪api */
    useBCutAPI: boolean
    /** 上传分p持久化 */
    useUploadPartPersistence: boolean
  }
  /** 录制配置 */
  recorder: GlobalRecorder
  /** 直播间管理 */
  recorders: Recorder[]
  // 视频订阅
  video: {
    /** 订阅间隔 */
    subCheckInterval: number
    /** 保存路径 */
    subSavePath: string
  }
  // 虚拟录制
  virtualRecord: {
    config: {
      mode: 'normal' | 'advance'
      // uuid
      id: string
      // 是否启用
      switch: boolean
      // 虚拟直播间号
      roomId: string
      // 房间号正则
      roomIdRegex: string
      // 标题正则
      titleRegex: string
      // 主播名称
      username: string
      // 主播名称正则
      usernameRegex: string
      /** 监听文件夹 */
      watchFolder: string[]
      /** 文件匹配规则，只有匹配的文件才会被处理 */
      fileMatchRegex: string
      /** 忽略文件正则，匹配的文件将被忽略 */
      ignoreFileRegex: string
      /** 是否自动匹配开始时间 */
      startTimeAutoMatch?: boolean
    }[]
    // mode: "watch" | "interval";
    startTime: number
  }
}

export interface NOtifyData {
  title: string
  desp: string
  options: AppConfig
  notifyType: AppConfig['notification']['setting']['type']
}
