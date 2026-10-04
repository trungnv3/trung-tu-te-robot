const fs = require("fs");

const s = fs.readFileSync(
  "./public/admin/admin.js",
  "utf8"
);

const stack = [];

let line = 1;
let col = 1;

let state = "code";
let quote = "";

for (let i = 0; i < s.length; i++) {
  const ch = s[i];
  const next = s[i + 1];

  if (state === "code") {
    if (ch === "/" && next === "/") {
      state = "line";
      i++;
      col += 2;
      continue;
    }

    if (ch === "/" && next === "*") {
      state = "block";
      i++;
      col += 2;
      continue;
    }

    if (ch === '"' || ch === "'") {
      state = "string";
      quote = ch;
      col++;
      continue;
    }

    if (ch === "`") {
      state = "template";
      col++;
      continue;
    }

    if (ch === "{") {
      stack.push({
        line: line,
        col: col
      });
    }

    if (ch === "}") {
      if (stack.length === 0) {
        console.log(
          "Dau } du thua tai:",
          line,
          col
        );
      } else {
        stack.pop();
      }
    }
  }

  else if (state === "line") {
    if (ch === "\n") {
      state = "code";
    }
  }

  else if (state === "block") {
    if (ch === "*" && next === "/") {
      state = "code";
      i++;
      col += 2;
      continue;
    }
  }

  else if (state === "string") {
    if (ch === "\\") {
      i++;
      col += 2;
      continue;
    }

    if (ch === quote) {
      state = "code";
    }
  }

  else if (state === "template") {
    if (ch === "\\") {
      i++;
      col += 2;
      continue;
    }

    if (ch === "`") {
      state = "code";
    }
  }

  if (ch === "\n") {
    line++;
    col = 1;
  } else {
    col++;
  }
}

console.log("");
console.log(
  "So dau { chua dong:",
  stack.length
);

if (stack.length > 0) {
  console.log("");
  console.log("Vi tri cac dau { chua dong:");

  for (const item of stack) {
    console.log(
      "Dong",
      item.line,
      "- cot",
      item.col
    );
  }
}