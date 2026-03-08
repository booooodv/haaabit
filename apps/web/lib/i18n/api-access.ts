import type { SupportedLocale } from "./messages";

export type ApiAccessCopy = {
  feedback: {
    rotatePendingTitle: (hasToken: boolean) => string;
    refreshPendingTitle: string;
    pendingMessage: string;
    rotateSuccessTitle: (hasToken: boolean) => string;
    rotateSuccessMessage: string;
    updateErrorTitle: string;
    copySuccessTitle: string;
    copySuccessMessage: string;
    copyErrorTitle: string;
  };
  page: {
    eyebrow: string;
    title: string;
    description: string;
    tokenLabel: string;
    tokenDescription: string;
    guidanceTitle: string;
    guidanceLines: string[];
    emptyStateTitle: string;
    emptyStateDescription: string;
    actions: {
      generate: string;
      rotate: string;
      reveal: string;
      hide: string;
      copy: string;
    };
    disabledHint: string;
    quickstart: {
      eyebrow: string;
      title: string;
      description: string;
      docsLink: string;
      specLink: string;
    };
  };
};

const apiAccessCopy: Record<SupportedLocale, ApiAccessCopy> = {
  en: {
    feedback: {
      rotatePendingTitle: (hasToken) => (hasToken ? "Rotating token" : "Generating token"),
      refreshPendingTitle: "Refreshing token",
      pendingMessage: "Token controls stay locked until the current request finishes.",
      rotateSuccessTitle: (hasToken) => (hasToken ? "Token rotated" : "Token generated"),
      rotateSuccessMessage: "Store this bearer token now. Replacing it invalidates the previous value immediately.",
      updateErrorTitle: "Unable to update API access",
      copySuccessTitle: "Token copied",
      copySuccessMessage: "The token is in your clipboard. Paste it only into a trusted client or secret store.",
      copyErrorTitle: "Unable to copy token",
    },
    page: {
      eyebrow: "AI integration",
      title: "API access",
      description: "Manage the personal bearer token your scripts and assistants should use when calling Haaabit.",
      tokenLabel: "Personal API token",
      tokenDescription: "Hidden by default. Reveal it only when you need to copy it into a trusted client.",
      guidanceTitle: "Treat this token like a password.",
      guidanceLines: [
        "Store it in a trusted secret store or private environment file.",
        "Rotation invalidates the previous token immediately.",
      ],
      emptyStateTitle: "No personal API token yet",
      emptyStateDescription: "No personal API token has been generated yet.",
      actions: {
        generate: "Generate token",
        rotate: "Rotate token",
        reveal: "Reveal token",
        hide: "Hide token",
        copy: "Copy token",
      },
      disabledHint: "Token controls unlock after the current request settles.",
      quickstart: {
        eyebrow: "Quickstart",
        title: "First call",
        description: "Start with the bearer header, then verify the connection against today's summary endpoint.",
        docsLink: "Open API docs",
        specLink: "OpenAPI JSON",
      },
    },
  },
  "zh-CN": {
    feedback: {
      rotatePendingTitle: (hasToken) => (hasToken ? "正在轮换 token" : "正在生成 token"),
      refreshPendingTitle: "正在刷新 token",
      pendingMessage: "当前请求完成前，token 控件会暂时锁定。",
      rotateSuccessTitle: (hasToken) => (hasToken ? "token 已轮换" : "token 已生成"),
      rotateSuccessMessage: "请现在就妥善保存这个 bearer token。替换后，旧值会立即失效。",
      updateErrorTitle: "暂时无法更新 API 访问",
      copySuccessTitle: "token 已复制",
      copySuccessMessage: "token 已进入剪贴板。请只把它粘贴到可信客户端或私密凭据存储里。",
      copyErrorTitle: "暂时无法复制 token",
    },
    page: {
      eyebrow: "AI 集成",
      title: "API 访问",
      description: "管理脚本和助手在调用 Haaabit 时应使用的个人 bearer token。",
      tokenLabel: "个人 API token",
      tokenDescription: "默认隐藏。只有在你确实需要复制到可信客户端时才显示它。",
      guidanceTitle: "请像保管密码一样保管这个 token。",
      guidanceLines: [
        "把它存进可信的密钥管理工具或私有环境变量文件。",
        "轮换后，旧 token 会立即失效。",
      ],
      emptyStateTitle: "还没有个人 API token",
      emptyStateDescription: "当前还没有生成个人 API token。",
      actions: {
        generate: "生成 token",
        rotate: "轮换 token",
        reveal: "显示 token",
        hide: "隐藏 token",
        copy: "复制 token",
      },
      disabledHint: "当前请求完成后，token 控件会恢复可用。",
      quickstart: {
        eyebrow: "快速开始",
        title: "第一条调用",
        description: "先带上 bearer header，再用 today summary 接口验证连接是否正常。",
        docsLink: "打开 API 文档",
        specLink: "OpenAPI JSON",
      },
    },
  },
};

export function getApiAccessCopy(locale: SupportedLocale) {
  return apiAccessCopy[locale];
}
