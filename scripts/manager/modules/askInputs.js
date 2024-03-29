const inquirer = require("inquirer");
const format = require("date-fns/format");

const getGitTagArray = require("../../utilities/getGitTagArray");
const getGitTaggingDateArray = require("../../utilities/getGitTaggingDateArray");
const isEmail = require("../../utilities/isEmail");
const isInputs = require("../../utilities/isInputs");
const isSelects = require("../../utilities/isSelects");

const MODE_ITEMS = [
  {
    name: "更新",
    value: "update",
  },
  {
    name: "登録",
    value: "upload",
  },
  {
    name: "削除",
    value: "remove",
  },
  {
    name: "エイリアス登録",
    value: "alias",
  },
  {
    name: "移行（v4 を v5 に置換）",
    value: "migration",
  },
];

const CATEGORY_ITEMS = [
  {
    name: "基本セット",
    value: "v5_basic",
  },
  {
    name: "拡張セット",
    value: "v5_extra",
  },
  {
    name: "露骨セット",
    value: "v5_explicit",
  },
];

const MONTH_LIST = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const V5_TAGGING_DATES = getGitTaggingDateArray()
  .filter((v) => /^v5/.test(v))
  .map((v) => {
    const [tag, ...dates] = v.split(" ");
    const [week, month, day, time, year, diff] = dates.filter((v) => v !== "");
    const mn = MONTH_LIST.indexOf(month);
    return [tag, format(new Date(year, mn, day), "yyyy年M月d日公開")];
  })
  .reduce(
    (acc, value) => ({
      ...acc,
      ...{ [value[0]]: value[1] },
    }),
    {}
  );

const FULL_VERSIONS_ITEMS = getGitTagArray("v5")
  .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
  .map((tag) => ({
    name: `${tag}（${V5_TAGGING_DATES[tag]}）`,
    value: tag,
  }));

// inquirer Setting
const questions = (additional) => [
  {
    type: "input",
    name: "workspace",
    message: "ワークスペースのサブドメインを入力してください:",
    validate: isInputs,
  },
  {
    type: "input",
    name: "email",
    message: "メールアドレスを入力してください:",
    validate: isEmail,
  },
  {
    type: "password",
    name: "password",
    mask: "*",
    message: "パスワードを入力してください:",
    validate: isInputs,
  },
  {
    type: "list",
    name: "mode",
    message: "モードを選択してください:",
    choices: MODE_ITEMS,
  },
  {
    when: ({ mode }) =>
      mode === "update" || mode === "upload" || mode === "remove",
    type: "list",
    message: "対象タイプを選択してください:",
    name: "term",
    choices: [
      {
        name: "カテゴリーごと",
        value: "category",
      },
      {
        name: "バージョンごと",
        value: "version",
      },
    ],
    validate: isSelects,
  },
  {
    when: ({ term }) => term === "category",
    type: "checkbox",
    message: "カテゴリーを選択してください:",
    name: "configs",
    choices: ({ mode }) => {
      return mode === "remove"
        ? [
            ...CATEGORY_ITEMS,
            {
              name: "v5 以降でファイル名にミスがあったもの",
              value: "v5_fixed",
            },
          ]
        : CATEGORY_ITEMS;
    },
    validate: isSelects,
  },
  {
    when: ({ term }) => term === "version",
    type: "checkbox",
    message: "バージョンを選択してください:",
    name: "configs",
    choices: () => {
      if (additional) {
        FULL_VERSIONS_ITEMS.unshift({
          name: `${additional}（ユーザーが追加したバージョン）`,
          value: additional,
        });
      }
      return [new inquirer.Separator(), ...FULL_VERSIONS_ITEMS];
    },
    validate: isSelects,
  },
  // {
  //   when: ({ mode, term }) => (mode === "update" || mode === "upload") && term === "version",
  //   type: "list",
  //   message: "選択したバージョンに含まれる「露骨」カテゴリーのデコモジを追加対象に含めますか？:",
  //   name: "excludeExplicit",
  //   choices: [
  //     {
  //       name: "含めない",
  //       value: false,
  //     },
  //     {
  //       name: "含める（「露骨」カテゴリの中身を理解していますか？　していない場合、含めない方が良いです）",
  //       value: true
  //     },
  //   ],
  //   validate: isSelects,
  // },
  {
    when: ({ mode }) => mode === "alias",
    type: "checkbox",
    name: "configs",
    message: "エイリアスを選択してください:",
    choices: [
      {
        name: "v5 以降でファイル名を修正したもの",
        value: "v5_rename",
      },
    ],
    validate: isSelects,
  },
  {
    when: ({ mode }) =>
      mode === "update" || mode === "remove" || mode === "migration",
    type: "list",
    message: ({ mode }) => {
      const common = "削除の強さを選択してください:";
      const upgrade =
        "更新及び移行モードでは修正された古いデコモジを削除します。";
      return mode === "remove" ? `${common}` : `${upgrade}${common}`;
    },
    name: "forceRemove",
    choices: [
      {
        name: "強（権限があれば他メンバーが登録したデコモジも消す）",
        value: true,
      },
      {
        name: "弱（自分が登録したデコモジだけ消す）",
        value: false,
      },
    ],
    validate: isSelects,
  },
];

module.exports = (callback, additional) => {
  inquirer.prompt(questions(additional)).then(callback);
};
