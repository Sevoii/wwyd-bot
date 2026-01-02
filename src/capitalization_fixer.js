const wwyd = require("./assets/wwyd.json");
const fs = require("fs");

const formatJson = (arr) => {
  return (
    "[\n" + arr.map((obj) => "  " + JSON.stringify(obj)).join(",\n") + "\n]"
  );
};

for (let i of wwyd) {
  i.comment = i.comment.map((x) =>
    typeof x === "string"
      ? x.replace(
          /(\.\s*)([a-z])/g,
          (_, space, letter) => space + letter.toUpperCase(),
        )
      : x,
  );

  if (typeof i.comment[0] === "string") {
    i.comment[0] = i.comment[0][0].toUpperCase() + i.comment[0].substring(1);
  }
}

fs.writeFileSync("./assets/wwyd.json", formatJson(wwyd), "utf8");
