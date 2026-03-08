export type SupportedLocale = "en" | "zh-CN";

export type LocaleMessages = {
  meta: {
    localeSwitchLabel: string;
  };
  auth: {
    page: {
      eyebrow: string;
      title: string;
      description: string;
      values: Array<{
        label: string;
        text: string;
      }>;
    };
    form: {
      feedback: {
        invalidTitle: string;
        invalidMessage: string;
        submitTitles: {
          signIn: string;
          signUp: string;
        };
        submitMessage: string;
        submitErrorTitle: string;
      };
      fields: {
        name: {
          label: string;
          description: string;
          required: string;
        };
        email: {
          label: string;
          description: string;
          required: string;
          invalid: string;
        };
        password: {
          label: string;
          signInDescription: string;
          signUpDescription: string;
          required: string;
          short: string;
          invalidCredentials: string;
        };
      };
      mode: {
        signIn: {
          eyebrow: string;
          description: string;
          submit: string;
          pending: string;
          switchLabel: string;
          switchAction: string;
        };
        signUp: {
          eyebrow: string;
          description: string;
          submit: string;
          pending: string;
          switchLabel: string;
          switchAction: string;
        };
      };
      disabledHint: string;
    };
  };
  shell: {
    brandCopy: string;
    navigation: {
      dashboard: string;
      habits: string;
      apiAccess: string;
    };
    signOut: string;
  };
};

export const messages: Record<SupportedLocale, LocaleMessages> = {
  en: {
    meta: {
      localeSwitchLabel: "Language switch",
    },
    auth: {
      page: {
        eyebrow: "Private by deployment",
        title: "Sign in to Haaabit",
        description:
          "Stored on the deployment you control. Sign in to the same local account you will use for today's check-ins, edits, and later AI-assisted actions.",
        values: [
          {
            label: "Local account",
            text: "Credentials stay tied to this self-hosted deployment, not a shared cloud account.",
          },
          {
            label: "Today ready",
            text: "Land in a dashboard that tells you what is due, what is done, and what needs correction.",
          },
          {
            label: "Calm recovery",
            text: "If a sign-in attempt fails, your entered details stay in place so you can correct and continue.",
          },
        ],
      },
      form: {
        feedback: {
          invalidTitle: "Check these details",
          invalidMessage: "Fix the highlighted fields and try again.",
          submitTitles: {
            signIn: "Signing you in",
            signUp: "Creating your account",
          },
          submitMessage: "This form stays locked until the current request finishes.",
          submitErrorTitle: "Unable to continue",
        },
        fields: {
          name: {
            label: "Name",
            description: "Use a name you will recognize when you come back to this deployment.",
            required: "Add a name for this local account.",
          },
          email: {
            label: "Email",
            description: "Use the email you want tied to this self-hosted account.",
            required: "Enter the email tied to this deployment.",
            invalid: "Enter a valid email address.",
          },
          password: {
            label: "Password",
            signInDescription: "Use the password already stored on this deployment.",
            signUpDescription: "Use at least 8 characters.",
            required: "Enter your password to continue.",
            short: "Use at least 8 characters.",
            invalidCredentials: "Check your email and password, then try again.",
          },
        },
        mode: {
          signIn: {
            eyebrow: "Private account access",
            description:
              "Use the account already stored on this deployment. Your details stay in place if you need to correct them.",
            submit: "Sign in",
            pending: "Signing in...",
            switchLabel: "Need a new account?",
            switchAction: "Create account",
          },
          signUp: {
            eyebrow: "Create a local account",
            description:
              "This account lives on the deployment you control, so you can sign in later without leaving your self-hosted workflow.",
            submit: "Create account",
            pending: "Creating account...",
            switchLabel: "Already have an account?",
            switchAction: "Back to sign in",
          },
        },
        disabledHint: "The primary action will unlock as soon as this request settles.",
      },
    },
    shell: {
      brandCopy: "Calm daily execution with a stable AI-ready habit system.",
      navigation: {
        dashboard: "Today",
        habits: "Habits",
        apiAccess: "API Access",
      },
      signOut: "Log out",
    },
  },
  "zh-CN": {
    meta: {
      localeSwitchLabel: "语言切换",
    },
    auth: {
      page: {
        eyebrow: "由你部署，数据由你掌控",
        title: "登录 Haaabit",
        description:
          "数据保存在你控制的部署上。登录同一个本地账户，继续今天的打卡、编辑以及后续的 AI 辅助操作。",
        values: [
          {
            label: "本地账户",
            text: "凭据只属于这套自托管部署，不会绑定到共享云账户。",
          },
          {
            label: "今天就绪",
            text: "进入后先看到今天该做什么、已经完成什么、还有哪里需要修正。",
          },
          {
            label: "平静恢复",
            text: "如果登录失败，你刚刚输入的内容会保留下来，方便直接修正后继续。",
          },
        ],
      },
      form: {
        feedback: {
          invalidTitle: "请检查这些信息",
          invalidMessage: "修正高亮字段后再试一次。",
          submitTitles: {
            signIn: "正在为你登录",
            signUp: "正在创建账户",
          },
          submitMessage: "当前请求完成前，表单会暂时锁定。",
          submitErrorTitle: "暂时无法继续",
        },
        fields: {
          name: {
            label: "名称",
            description: "使用一个下次回到这套部署时你仍能识别的名字。",
            required: "请为这个本地账户填写名称。",
          },
          email: {
            label: "邮箱",
            description: "使用你希望绑定到这套自托管账户的邮箱。",
            required: "请输入这套部署对应的邮箱。",
            invalid: "请输入有效的邮箱地址。",
          },
          password: {
            label: "密码",
            signInDescription: "使用这套部署里已经保存的密码。",
            signUpDescription: "请至少使用 8 个字符。",
            required: "请输入密码后继续。",
            short: "请至少使用 8 个字符。",
            invalidCredentials: "请检查邮箱和密码后再试一次。",
          },
        },
        mode: {
          signIn: {
            eyebrow: "本地账户登录",
            description: "使用这套部署里已有的账户登录；如果需要修正信息，已填内容会继续保留。",
            submit: "登录",
            pending: "登录中...",
            switchLabel: "还没有账户？",
            switchAction: "创建账户",
          },
          signUp: {
            eyebrow: "创建本地账户",
            description: "这个账户只存在于你控制的部署中，之后你可以在同一套自托管流程里继续登录使用。",
            submit: "创建账户",
            pending: "创建中...",
            switchLabel: "已经有账户了？",
            switchAction: "返回登录",
          },
        },
        disabledHint: "当前请求完成后，主操作会立即恢复可用。",
      },
    },
    shell: {
      brandCopy: "平静完成每天该做的事，同时保持一套稳定、可供 AI 读取的习惯系统。",
      navigation: {
        dashboard: "今天",
        habits: "习惯",
        apiAccess: "API 访问",
      },
      signOut: "退出登录",
    },
  },
};
