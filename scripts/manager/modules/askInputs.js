const inquirer = require("inquirer");

const convertToLowerCasedArray = require("../../utilities/convertToLowerCasedArray");
const getGitTagArray = require("../../utilities/getGitTagArray");
const isEmail = require("../../utilities/isEmail");
const isInputs = require("../../utilities/isInputs");
const isSelects = require("../../utilities/isSelects");


// リポジトリのタグから minor バージョンごとの選択肢を作る
const VERSION_ITEMS = getGitTagArray("v5")
  .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
  .reduce((acc, tag, i, original) => {
    const c_minor = tag.split(".")[1];
    const o_minor = i > 0 && original[i - 1].split(".")[1];
    // 同じマイナーバージョンならその value[] に追加する
    if (c_minor === o_minor) {
      acc[acc.length - 1].value.push(tag);
      return acc;
    }
    // 新しいマイナーバージョンなら新しいオブジェクトを accumulator に追加する
    return acc.concat({
      name: `v5.${c_minor}.x`,
      value: [tag],
    });
  }, []);

// inquirer Setting
const questions = [
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
    choices: [
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
    ],
  },
  {
    when: (answers) => {
      return answers.mode === "upload" || answers.mode === "remove";
    },
    type: "list",
    message: "対象タイプを選択してください:",
    name: "term",
    choices: [
      {
        name: "カテゴリー（basic, extra, explict のいずれかを選択）",
        value: "category",
      },
      {
        name: "バージョン（ v5.*.* ごとに選択可能）",
        value: "version",
      },
    ],
    validate: isSelects,
  },
  {
    when: (answers) => {
      return answers.term === "category";
    },
    type: "checkbox",
    message: "カテゴリーを選択してください:",
    name: "configs",
    choices: [
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
      {
        name: "v5 以降でファイル名にミスがあったもの",
        value: "v5_fixed",
      },
    ],
    filter: convertToLowerCasedArray,
    validate: isSelects,
  },
  {
    when: (answers) => {
      return answers.term === "version";
    },
    type: "checkbox",
    message: "バージョンを選択してください:",
    name: "configs",
    choices: [new inquirer.Separator(), ...VERSION_ITEMS],
    validate: isSelects,
    filter: convertToLowerCasedArray,
  },
  {
    when: (answers) => {
      return answers.mode === "alias";
    },
    type: "checkbox",
    name: "configs",
    message: "エイリアスを選択してください:",
    choices: [
      {
        name: "v5 以降でファイル名を修正したもの",
        value: "v5_rename",
      },
    ],
    filter: convertToLowerCasedArray,
    validate: isSelects,
  },
  // {
  //   type: "list",
  //   name: "suffix",
  //   message: "Select suffix mode.",
  //   choices: [
  //     {
  //       name: "nothing",
  //       value: false,
  //     },
  //     {
  //       name: "recommended ('_dcmj')",
  //       value: true,
  //     },
  //     {
  //       name: "custom",
  //     },
  //   ],
  //   default: true,
  // },
  // {
  //   type: "input",
  //   name: "customSuffix",
  //   message: "Enter your suffix.",
  //   when: function (answers) {
  //     return answers.suffix === "custom";
  //   },
  // },
];

module.exports = (callback) => {
  inquirer.prompt(questions).then(callback);
};
