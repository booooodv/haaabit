import type { HabitDetailHistoryRow, Weekday } from "@haaabit/contracts/habits";

import type { SupportedLocale } from "./messages";

type HabitStatus = "active" | "archived";
type HabitFrequencyType = "daily" | "weekly_count" | "monthly_count" | "weekdays";

export type HabitsCopy = {
  page: {
    header: {
      eyebrow: string;
      title: string;
      description: string;
    };
    toolbar: {
      label: string;
      description: string;
      newHabit: string;
      statusGroupLabel: string;
      active: string;
      archived: string;
      workingSetSummary: (status: HabitStatus, count: number) => string;
    };
    filters: {
      search: string;
      searchPlaceholder: string;
      category: string;
      categoryPlaceholder: string;
      kind: string;
      kindOptions: {
        all: string;
        boolean: string;
        quantity: string;
      };
    };
    feedback: {
      updatingErrorTitle: string;
      refreshPendingTitle: string;
      refreshPendingMessage: string;
      archivePendingTitle: string;
      archivePendingMessage: string;
      archiveSuccessTitle: string;
      archiveSuccessMessage: string;
      restorePendingTitle: string;
      restorePendingMessage: string;
      restoreSuccessTitle: string;
      restoreSuccessMessage: string;
      saveCreatePendingTitle: string;
      saveEditPendingTitle: string;
      savePendingMessage: string;
      createSuccessTitle: string;
      createSuccessMessage: string;
      editSuccessTitle: string;
      editSuccessMessage: string;
    };
    card: {
      noDescription: string;
      primaryAction: string;
      edit: string;
      archive: string;
      restore: string;
      metaLabels: {
        frequency: string;
        target: string;
        startDate: string;
        state: string;
      };
      state: {
        active: string;
        archived: string;
      };
      booleanKind: string;
      quantityKind: string;
      unitsFallback: string;
      uncategorized: string;
      emptyState: {
        activeTitle: string;
        activeDescription: string;
        archivedTitle: string;
        archivedDescription: string;
      };
    };
    overlay: {
      createTitle: string;
      editTitle: (name: string) => string;
      createDescription: string;
      editDescription: string;
      createSubmit: string;
      editSubmit: string;
      closeLabel: string;
    };
    frequency: {
      daily: string;
      weeklyCount: (count: number) => string;
      monthlyCount: (count: number) => string;
      weekdays: (days: Weekday[]) => string;
    };
  };
  form: {
    futureOnly: {
      title: string;
      description: string;
    };
    fields: {
      name: string;
      kind: {
        label: string;
        description: string;
        editDescription: string;
        options: {
          boolean: string;
          quantity: string;
        };
      };
      startDate: {
        label: string;
        description: string;
      };
      frequency: {
        label: string;
        options: {
          daily: string;
          weeklyCount: string;
          weekdays: string;
          monthlyCount: string;
        };
      };
      countTarget: {
        label: string;
        weeklyDescription: string;
        monthlyDescription: string;
      };
      weekdaysLegend: string;
      description: {
        label: string;
        description: string;
      };
      category: {
        label: string;
        description: string;
      };
      targetValue: string;
      unit: {
        label: string;
        description: string;
      };
    };
    weekdays: Array<{ label: string; value: Weekday }>;
    errorTitle: string;
    cancel: string;
    pendingSubmit: string;
  };
  detail: {
    noDescription: string;
    closeLabel: string;
    summaryAriaLabel: string;
    kicker: string;
    status: {
      active: string;
      archived: string;
    };
    facts: {
      frequency: string;
      category: string;
      target: string;
      uncategorized: string;
      boolean: string;
      unitsFallback: string;
    };
    stats: {
      currentStreak: string;
      longestStreak: string;
      totalCompletions: string;
      interruptions: string;
    };
    sections: {
      trends: string;
      history: string;
      last7Days: string;
      last7DaysSubtitle: string;
      last30Days: string;
      last30DaysSubtitle: string;
    };
    chartNotDue: string;
  };
  history: {
    status: {
      completed: string;
      missed: string;
    };
    periodSeparator: string;
  };
  onboarding: {
    eyebrow: string;
    title: string;
    description: string;
    noticeTitle: string;
    noticeBody: string;
    submitLabel: string;
  };
};

const weekdayLabels: Record<SupportedLocale, Record<Weekday, string>> = {
  en: {
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday",
  },
  "zh-CN": {
    monday: "周一",
    tuesday: "周二",
    wednesday: "周三",
    thursday: "周四",
    friday: "周五",
    saturday: "周六",
    sunday: "周日",
  },
};

const habitsCopy: Record<SupportedLocale, HabitsCopy> = {
  en: {
    page: {
      header: {
        eyebrow: "Maintenance surface",
        title: "Habits",
        description: "Search, edit, archive, and restore habits without touching historical records.",
      },
      toolbar: {
        label: "Working set",
        description: "Keep the list readable, then open detail only when a habit needs deeper inspection.",
        newHabit: "New habit",
        statusGroupLabel: "Habit status",
        active: "Active",
        archived: "Archived",
        workingSetSummary: (status, count) => {
          if (count === 0) {
            return status === "active" ? "No active habits in view" : "No archived habits in view";
          }

          return `${count} ${status} ${count === 1 ? "habit" : "habits"} in view`;
        },
      },
      filters: {
        search: "Search",
        searchPlaceholder: "Search name or category",
        category: "Category",
        categoryPlaceholder: "Filter by category",
        kind: "Kind",
        kindOptions: {
          all: "All kinds",
          boolean: "Check-in",
          quantity: "Quantity",
        },
      },
      feedback: {
        updatingErrorTitle: "Unable to update habits",
        refreshPendingTitle: "Refreshing habits",
        refreshPendingMessage: "Filters and saved changes stay in place while this list updates.",
        archivePendingTitle: "Archiving habit",
        archivePendingMessage: "The list will refresh in place when this update settles.",
        archiveSuccessTitle: "Habit archived",
        archiveSuccessMessage: "Archived habits move out of the active list without losing history.",
        restorePendingTitle: "Restoring habit",
        restorePendingMessage: "The archived list will refresh in place when this update settles.",
        restoreSuccessTitle: "Habit restored",
        restoreSuccessMessage: "The habit is back in the active working set and keeps its history.",
        saveCreatePendingTitle: "Saving new habit",
        saveEditPendingTitle: "Saving habit changes",
        savePendingMessage: "The list will refresh in place once the latest habit changes land.",
        createSuccessTitle: "Habit created",
        createSuccessMessage: "The new habit is now part of the current working set.",
        editSuccessTitle: "Habit updated",
        editSuccessMessage: "Future behavior has been updated without rewriting history.",
      },
      card: {
        noDescription: "No description yet.",
        primaryAction: "View details",
        edit: "Edit",
        archive: "Archive",
        restore: "Restore",
        metaLabels: {
          frequency: "Frequency",
          target: "Target",
          startDate: "Start date",
          state: "State",
        },
        state: {
          active: "Active",
          archived: "Archived",
        },
        booleanKind: "Check-in",
        quantityKind: "Quantity",
        unitsFallback: "units",
        uncategorized: "Uncategorized",
        emptyState: {
          activeTitle: "No active habits match these filters",
          activeDescription: "Adjust search, category, or kind to bring habits back into view.",
          archivedTitle: "No archived habits match these filters",
          archivedDescription: "Archived habits stay here until you restore them to the active list.",
        },
      },
      overlay: {
        createTitle: "Create habit",
        editTitle: (name) => `Edit ${name}`,
        createDescription: "Add a habit to the working set without leaving the management surface.",
        editDescription: "Refine future behavior here. Historical records stay untouched.",
        createSubmit: "Create habit",
        editSubmit: "Save changes",
        closeLabel: "Close",
      },
      frequency: {
        daily: "Daily",
        weeklyCount: (count) => `${count} times per week`,
        monthlyCount: (count) => `${count} times per month`,
        weekdays: (days) => days.map((day) => weekdayLabels.en[day]).join(", "),
      },
    },
    form: {
      futureOnly: {
        title: "Future-only edits",
        description: "Changes update future behavior without rewriting historical records.",
      },
      fields: {
        name: "Habit name",
        kind: {
          label: "Habit type",
          description: "Choose whether the habit is check-in based or quantity-based.",
          editDescription: "Locked after creation.",
          options: {
            boolean: "Check-in",
            quantity: "Quantity",
          },
        },
        startDate: {
          label: "Start date",
          description: "Leave blank to start today.",
        },
        frequency: {
          label: "Frequency",
          options: {
            daily: "Daily",
            weeklyCount: "Weekly count",
            weekdays: "Selected weekdays",
            monthlyCount: "Monthly count",
          },
        },
        countTarget: {
          label: "Count target",
          weeklyDescription: "How many times per week?",
          monthlyDescription: "How many times per month?",
        },
        weekdaysLegend: "Weekdays",
        description: {
          label: "Description",
          description: "Optional context for you or the AI assistant.",
        },
        category: {
          label: "Category",
          description: "Useful for grouping and search later.",
        },
        targetValue: "Target value",
        unit: {
          label: "Unit",
          description: "Examples: pages, glasses, kilometers.",
        },
      },
      weekdays: (Object.keys(weekdayLabels.en) as Weekday[]).map((value) => ({
        value,
        label: weekdayLabels.en[value],
      })),
      errorTitle: "Unable to save habit",
      cancel: "Cancel",
      pendingSubmit: "Saving...",
    },
    detail: {
      noDescription: "No description yet.",
      closeLabel: "Close",
      summaryAriaLabel: "Habit summary",
      kicker: "Health snapshot",
      status: {
        active: "Active",
        archived: "Archived",
      },
      facts: {
        frequency: "Frequency",
        category: "Category",
        target: "Target",
        uncategorized: "Uncategorized",
        boolean: "Check-in",
        unitsFallback: "units",
      },
      stats: {
        currentStreak: "Current streak",
        longestStreak: "Longest streak",
        totalCompletions: "Total completions",
        interruptions: "Interruptions",
      },
      sections: {
        trends: "Recent trends",
        history: "Recent history",
        last7Days: "Last 7 days",
        last7DaysSubtitle: "Daily-granularity habit progress",
        last30Days: "Last 30 days",
        last30DaysSubtitle: "Longer habit completion trend",
      },
      chartNotDue: "Not due",
    },
    history: {
      status: {
        completed: "completed",
        missed: "missed",
      },
      periodSeparator: "->",
    },
    onboarding: {
      eyebrow: "Onboarding",
      title: "Create your first habit",
      description: "Your account is ready. Add one clear habit now so later logins can route straight into a useful dashboard.",
      noticeTitle: "Start simple",
      noticeBody: "You can refine categories, targets, and scheduling patterns later. Right now, aim for one habit you genuinely expect to check today.",
      submitLabel: "Create first habit",
    },
  },
  "zh-CN": {
    page: {
      header: {
        eyebrow: "管理面板",
        title: "习惯",
        description: "在不触碰历史记录的前提下，搜索、编辑、归档和恢复习惯。",
      },
      toolbar: {
        label: "当前工作集合",
        description: "先把列表收得清楚，再只在某个习惯确实需要深看时打开详情。",
        newHabit: "新建习惯",
        statusGroupLabel: "习惯状态",
        active: "启用中",
        archived: "已归档",
        workingSetSummary: (status, count) => {
          if (count === 0) {
            return status === "active" ? "当前视图里没有启用中的习惯" : "当前视图里没有已归档的习惯";
          }

          return `当前视图里有 ${count} 个${status === "active" ? "启用中" : "已归档"}习惯`;
        },
      },
      filters: {
        search: "搜索",
        searchPlaceholder: "按名称或分类搜索",
        category: "分类",
        categoryPlaceholder: "按分类筛选",
        kind: "类型",
        kindOptions: {
          all: "全部类型",
          boolean: "打卡型",
          quantity: "数值型",
        },
      },
      feedback: {
        updatingErrorTitle: "暂时无法更新习惯",
        refreshPendingTitle: "正在刷新习惯列表",
        refreshPendingMessage: "筛选条件和已保存的更改会保持原位，直到列表刷新完成。",
        archivePendingTitle: "正在归档习惯",
        archivePendingMessage: "这次更新完成后，列表会在原地刷新。",
        archiveSuccessTitle: "习惯已归档",
        archiveSuccessMessage: "归档后的习惯会从启用列表中移出，但历史记录仍会保留。",
        restorePendingTitle: "正在恢复习惯",
        restorePendingMessage: "这次更新完成后，归档列表会在原地刷新。",
        restoreSuccessTitle: "习惯已恢复",
        restoreSuccessMessage: "这个习惯已经回到启用中的工作集合里，历史记录也会继续保留。",
        saveCreatePendingTitle: "正在保存新习惯",
        saveEditPendingTitle: "正在保存习惯更改",
        savePendingMessage: "最新更改落地后，列表会在原地刷新。",
        createSuccessTitle: "习惯已创建",
        createSuccessMessage: "这个新习惯已经加入当前工作集合。",
        editSuccessTitle: "习惯已更新",
        editSuccessMessage: "未来行为已更新，历史记录不会被重写。",
      },
      card: {
        noDescription: "暂时还没有描述。",
        primaryAction: "查看详情",
        edit: "编辑",
        archive: "归档",
        restore: "恢复",
        metaLabels: {
          frequency: "频率",
          target: "目标",
          startDate: "开始日期",
          state: "状态",
        },
        state: {
          active: "启用中",
          archived: "已归档",
        },
        booleanKind: "打卡型",
        quantityKind: "数值型",
        unitsFallback: "单位",
        uncategorized: "未分类",
        emptyState: {
          activeTitle: "没有启用中的习惯符合当前筛选",
          activeDescription: "调整搜索、分类或类型，就能把习惯重新带回视图里。",
          archivedTitle: "没有已归档的习惯符合当前筛选",
          archivedDescription: "已归档的习惯会留在这里，直到你把它恢复回启用列表。",
        },
      },
      overlay: {
        createTitle: "创建习惯",
        editTitle: (name) => `编辑 ${name}`,
        createDescription: "不离开管理面板，直接把一个习惯加入当前工作集合。",
        editDescription: "在这里调整未来行为；历史记录会保持不变。",
        createSubmit: "创建习惯",
        editSubmit: "保存更改",
        closeLabel: "关闭",
      },
      frequency: {
        daily: "每天",
        weeklyCount: (count) => `每周 ${count} 次`,
        monthlyCount: (count) => `每月 ${count} 次`,
        weekdays: (days) => days.map((day) => weekdayLabels["zh-CN"][day]).join("、"),
      },
    },
    form: {
      futureOnly: {
        title: "仅影响未来",
        description: "这些更改只会更新未来行为，不会改写历史记录。",
      },
      fields: {
        name: "习惯名称",
        kind: {
          label: "习惯类型",
          description: "选择这是一个打卡型习惯，还是按数值累计的习惯。",
          editDescription: "创建后不可更改。",
          options: {
            boolean: "打卡型",
            quantity: "数值型",
          },
        },
        startDate: {
          label: "开始日期",
          description: "留空则从今天开始。",
        },
        frequency: {
          label: "频率",
          options: {
            daily: "每天",
            weeklyCount: "每周次数",
            weekdays: "指定工作日",
            monthlyCount: "每月次数",
          },
        },
        countTarget: {
          label: "次数目标",
          weeklyDescription: "每周要做几次？",
          monthlyDescription: "每月要做几次？",
        },
        weekdaysLegend: "星期",
        description: {
          label: "描述",
          description: "给自己或 AI 助手补充一些可选上下文。",
        },
        category: {
          label: "分类",
          description: "方便后续分组和搜索。",
        },
        targetValue: "目标值",
        unit: {
          label: "单位",
          description: "例如：页、杯、公里。",
        },
      },
      weekdays: (Object.keys(weekdayLabels["zh-CN"]) as Weekday[]).map((value) => ({
        value,
        label: weekdayLabels["zh-CN"][value],
      })),
      errorTitle: "暂时无法保存习惯",
      cancel: "取消",
      pendingSubmit: "保存中...",
    },
    detail: {
      noDescription: "暂时还没有描述。",
      closeLabel: "关闭",
      summaryAriaLabel: "习惯摘要",
      kicker: "健康快照",
      status: {
        active: "启用中",
        archived: "已归档",
      },
      facts: {
        frequency: "频率",
        category: "分类",
        target: "目标",
        uncategorized: "未分类",
        boolean: "打卡型",
        unitsFallback: "单位",
      },
      stats: {
        currentStreak: "当前连续完成",
        longestStreak: "最长连续完成",
        totalCompletions: "累计完成次数",
        interruptions: "中断次数",
      },
      sections: {
        trends: "近期趋势",
        history: "近期历史",
        last7Days: "近 7 天",
        last7DaysSubtitle: "按天查看这个习惯的近期进展",
        last30Days: "近 30 天",
        last30DaysSubtitle: "更长时间范围内的完成趋势",
      },
      chartNotDue: "当天无任务",
    },
    history: {
      status: {
        completed: "已完成",
        missed: "未完成",
      },
      periodSeparator: "至",
    },
    onboarding: {
      eyebrow: "首次引导",
      title: "创建你的第一个习惯",
      description: "账户已经就绪。现在先加一个清晰的习惯，后续再次登录时才能直接进入一个真正有用的仪表盘。",
      noticeTitle: "先从简单开始",
      noticeBody: "分类、目标值和排期模式之后都还能继续细化。现在先选一个你今天真的会去打卡的习惯。",
      submitLabel: "创建第一个习惯",
    },
  },
};

export function getHabitsCopy(locale: SupportedLocale) {
  return habitsCopy[locale];
}
