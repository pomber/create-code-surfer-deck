const fs = require("fs-extra");
const path = require("path");
const os = require("os");
const exec = require("child_process").execSync;
const spawn = require("cross-spawn");
const https = require("https");
const tar = require("tar-fs");
const gunzip = require("gunzip-maybe");

const install = () => {
  return new Promise((resolve, reject) => {
    console.log("Installing dependencies...");
    const child = spawn("npm", ["install"], {
      stdio: "inherit"
    });
    child.on("close", code => {
      if (code !== 0) {
        reject();
        return;
      }
      resolve();
    });
  });
};

const gitInit = () => {
  exec("git --version", { stdio: "inherit" });
  exec("git init", { stdio: "inherit" });
  exec("git add .", { stdio: "inherit" });
  exec('git commit -am "Init"', { stdio: "inherit" });
  return true;
};

const getTar = ({ user, repo, templatepath = "", name }) => {
  return new Promise((resolve, reject) => {
    console.log("Downloading template...");
    const ignorePrefix = "__INITIT_IGNORE__/";
    const ignorepath = path.join(name, ignorePrefix);
    const extractTar = tar.extract(name, {
      map: header => {
        const prefix = `${repo}-master/${templatepath}`;
        if (header.name.startsWith(prefix)) {
          return Object.assign({}, header, {
            name: header.name.substr(prefix.length)
          });
        } else {
          return Object.assign({}, header, {
            name: ignorePrefix + header.name
          });
        }
      },
      ignore: filepath => {
        const isInIgnoreFolder = !path
          .relative(ignorepath, filepath)
          .startsWith("..");
        return isInIgnoreFolder;
      }
    });
    https.get(
      `https://codeload.github.com/${user}/${repo}/tar.gz/master`,
      response => response.pipe(gunzip()).pipe(extractTar)
    );
    extractTar.on("error", reject);
    extractTar.on("finish", resolve);
  });
};

const create = async (opts = {}) => {
  if (!opts.name) {
    throw new Error("name argument required");
  }

  if (!opts.template) {
    throw new Error("template argument required");
  }

  const dirname = path.resolve(opts.name);
  const name = path.basename(dirname);
  const [user, repo, ...paths] = opts.template.split("/");

  fs.ensureDirSync(name);

  await getTar(
    Object.assign({}, opts, {
      name,
      user,
      repo,
      templatepath: paths.join("/")
    })
  );

  const templatePkg = require(path.join(dirname, "package.json"));

  const pkg = Object.assign({}, templatePkg, {
    name,
    version: "1.0.0"
  });

  fs.writeFileSync(
    path.join(dirname, "package.json"),
    JSON.stringify(pkg, null, 2) + os.EOL
  );

  process.chdir(dirname);

  await install();
  gitInit();

  exec("npm test", { stdio: "inherit" });
  return { name, dirname };
};

module.exports = create;
