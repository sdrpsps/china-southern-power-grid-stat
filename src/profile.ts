import * as fs from "fs";
import * as path from "path";
import { CSGClient } from "./csg-client.js";

export const PROFILE_REGISTRY_ENV = "CSG_PROFILE_REGISTRY";
export const SESSION_FILE_ENV = "CSG_SESSION_FILE";

const RUNTIME_DIR = path.dirname(path.resolve(process.argv[1] || process.cwd()));

export type ProfileSelector = {
  profile?: string;
  allProfiles?: boolean;
  sessionPath?: string;
};

export type CSGProfile = {
  alias: string;
  label?: string;
  sessionPath: string;
  createdAt: string;
  updatedAt: string;
  source?: "registry" | "explicit-session";
};

export type ProfileRegistry = {
  defaultProfile?: string;
  profiles: CSGProfile[];
};

export function validateProfileAlias(alias: string): string {
  const value = alias.trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/.test(value)) {
    throw new Error(
      "用户配置别名必须以字母或数字开头，且只能包含字母、数字、点号、下划线或短横线。",
    );
  }
  return value;
}

export function validateAccountNumber(accountNumber: string): string {
  const value = String(accountNumber || "").trim();
  if (!/^\d{10,20}$/.test(value)) {
    throw new Error("缴费户号必须是 10 到 20 位数字字符串。");
  }
  return value;
}

export function validateYear(year: number): number {
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new Error("年份必须是 2000 到 2100 之间的 4 位整数。");
  }
  return year;
}

export function validateMonth(month: number): number {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error("月份必须是 1 到 12 之间的整数。");
  }
  return month;
}

export function getDefaultRegistryPath(): string {
  if (process.env[PROFILE_REGISTRY_ENV]) {
    return path.resolve(process.env[PROFILE_REGISTRY_ENV]!);
  }

  const runtimeRegistryPath = path.resolve(RUNTIME_DIR, ".csg/profiles.json");
  const projectRegistryPath = path.resolve(RUNTIME_DIR, "../.csg/profiles.json");
  const cwdRegistryPath = path.resolve(process.cwd(), ".csg/profiles.json");
  const isSourceRuntime =
    path.basename(RUNTIME_DIR) === "src" &&
    fs.existsSync(path.resolve(RUNTIME_DIR, "../package.json"));

  const candidates = isSourceRuntime
    ? [cwdRegistryPath, projectRegistryPath, runtimeRegistryPath]
    : [runtimeRegistryPath, cwdRegistryPath, projectRegistryPath];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return candidates[0];
}

export function getRegistryDir(registryPath = getDefaultRegistryPath()): string {
  return path.dirname(registryPath);
}

function normalizeSessionPath(
  sessionPath: string,
  registryPath = getDefaultRegistryPath(),
): string {
  return path.isAbsolute(sessionPath)
    ? sessionPath
    : path.resolve(getRegistryDir(registryPath), sessionPath);
}

function denormalizeSessionPath(
  sessionPath: string,
  registryPath = getDefaultRegistryPath(),
): string {
  const registryDir = getRegistryDir(registryPath);
  const relative = path.relative(registryDir, sessionPath);
  return relative.startsWith("..") ? sessionPath : relative;
}

export async function readProfileRegistry(
  registryPath = getDefaultRegistryPath(),
): Promise<ProfileRegistry> {
  if (!fs.existsSync(registryPath)) {
    return { profiles: [] };
  }

  let data: any;
  try {
    data = JSON.parse(await fs.promises.readFile(registryPath, "utf-8"));
  } catch {
    throw new Error(`用户配置注册表格式损坏：${registryPath}`);
  }

  const profiles = Array.isArray(data.profiles) ? data.profiles : [];
  return {
    defaultProfile:
      typeof data.defaultProfile === "string" ? data.defaultProfile : undefined,
    profiles: profiles.map((profile: any) => ({
      alias: validateProfileAlias(String(profile.alias || "")),
      label: typeof profile.label === "string" ? profile.label : undefined,
      sessionPath: normalizeSessionPath(
        String(profile.sessionPath || ""),
        registryPath,
      ),
      createdAt:
        typeof profile.createdAt === "string"
          ? profile.createdAt
          : new Date().toISOString(),
      updatedAt:
        typeof profile.updatedAt === "string"
          ? profile.updatedAt
          : new Date().toISOString(),
      source: "registry",
    })),
  };
}

export async function writeProfileRegistry(
  registry: ProfileRegistry,
  registryPath = getDefaultRegistryPath(),
): Promise<void> {
  const aliases = new Set<string>();
  const profiles = registry.profiles.map((profile) => {
    const alias = validateProfileAlias(profile.alias);
    if (aliases.has(alias)) {
      throw new Error(`用户配置别名重复：${alias}`);
    }
    aliases.add(alias);
    return {
      alias,
      label: profile.label,
      sessionPath: denormalizeSessionPath(
        path.resolve(profile.sessionPath),
        registryPath,
      ),
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  });

  if (registry.defaultProfile && !aliases.has(registry.defaultProfile)) {
    throw new Error(`默认用户配置不存在：${registry.defaultProfile}`);
  }

  await fs.promises.mkdir(path.dirname(registryPath), { recursive: true });
  await fs.promises.writeFile(
    registryPath,
    JSON.stringify({ defaultProfile: registry.defaultProfile, profiles }, null, 2),
    "utf-8",
  );
}

function getEnvSessionPath(): string | null {
  const envSession = process.env[SESSION_FILE_ENV];
  if (envSession && fs.existsSync(path.resolve(envSession))) {
    return path.resolve(envSession);
  }
  return null;
}

export async function listProfiles(
  options: { includeExplicitEnv?: boolean } = {},
): Promise<CSGProfile[]> {
  const registry = await readProfileRegistry();
  const profiles: CSGProfile[] = registry.profiles.map((profile) => ({
    ...profile,
    source: "registry",
  }));

  if (profiles.length === 0 && options.includeExplicitEnv !== false) {
    const envSessionPath = getEnvSessionPath();
    if (envSessionPath) {
      const now = new Date().toISOString();
      profiles.push({
        alias: "session",
        label: "环境变量会话",
        sessionPath: envSessionPath,
        createdAt: now,
        updatedAt: now,
        source: "explicit-session",
      });
    }
  }

  return profiles;
}

export async function resolveProfiles(
  selector: ProfileSelector = {},
): Promise<CSGProfile[]> {
  if (selector.sessionPath) {
    const now = new Date().toISOString();
    return [
      {
        alias: "session",
        label: "显式会话",
        sessionPath: path.resolve(selector.sessionPath),
        createdAt: now,
        updatedAt: now,
        source: "explicit-session",
      },
    ];
  }

  const envSessionPath = getEnvSessionPath();
  if (envSessionPath) {
    const now = new Date().toISOString();
    return [
      {
        alias: "session",
        label: "环境变量会话",
        sessionPath: envSessionPath,
        createdAt: now,
        updatedAt: now,
        source: "explicit-session",
      },
    ];
  }

  const registry = await readProfileRegistry();
  const profiles = await listProfiles({ includeExplicitEnv: false });

  if (selector.allProfiles) {
    if (profiles.length === 0) {
      throw new Error(
        "尚未配置任何用户配置。请先使用用户配置别名运行登录流程。",
      );
    }
    return profiles;
  }

  if (selector.profile) {
    const alias = validateProfileAlias(selector.profile);
    const profile = profiles.find((item) => item.alias === alias);
    if (!profile) {
      throw new Error(`未知用户配置 '${alias}'。请先列出用户配置并选择一个。`);
    }
    return [profile];
  }

  if (registry.defaultProfile) {
    const profile = profiles.find((item) => item.alias === registry.defaultProfile);
    if (!profile) {
      throw new Error(
        `已配置默认用户配置 '${registry.defaultProfile}'，但当前不可用。`,
      );
    }
    return [profile];
  }

  if (profiles.length === 1) {
    return [profiles[0]];
  }

  if (profiles.length > 1) {
    throw new Error("已配置多个用户配置。请指定 --profile 或 --all-profiles。");
  }

  throw new Error(
    "没有可用会话或用户配置。请先运行登录流程，或设置 CSG_SESSION_FILE。",
  );
}

export async function loadSessionData(sessionPath: string): Promise<Record<string, any>> {
  if (!fs.existsSync(sessionPath)) {
    throw new Error(`会话文件不存在：${sessionPath}`);
  }
  try {
    return JSON.parse(await fs.promises.readFile(sessionPath, "utf-8"));
  } catch {
    throw new Error(`会话文件格式损坏：${sessionPath}`);
  }
}

export async function initializeClientForProfile(profile: CSGProfile): Promise<CSGClient> {
  const sessionData = await loadSessionData(profile.sessionPath);
  const client = CSGClient.load(sessionData);
  try {
    await client.initialize();
  } catch (error: any) {
    throw new Error(
      `初始化用户配置 '${profile.alias}' 失败。会话可能已过期。${error?.message || error}`,
    );
  }
  return client;
}

export async function saveSessionForProfile(options: {
  alias: string;
  label?: string;
  sessionData: Record<string, any>;
  setDefault?: boolean;
  registryPath?: string;
}): Promise<CSGProfile> {
  const registryPath = options.registryPath || getDefaultRegistryPath();
  const alias = validateProfileAlias(options.alias);
  const registry = await readProfileRegistry(registryPath);
  const now = new Date().toISOString();
  const existing = registry.profiles.find((profile) => profile.alias === alias);
  const sessionPath =
    existing?.sessionPath ||
    path.resolve(getRegistryDir(registryPath), "sessions", `${alias}.session.json`);

  await fs.promises.mkdir(path.dirname(sessionPath), { recursive: true });
  await fs.promises.writeFile(
    sessionPath,
    JSON.stringify(options.sessionData, null, 2),
    "utf-8",
  );

  const profile: CSGProfile = {
    alias,
    label: options.label || existing?.label,
    sessionPath,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    source: "registry",
  };

  registry.profiles = existing
    ? registry.profiles.map((item) => (item.alias === alias ? profile : item))
    : [...registry.profiles, profile];

  if (options.setDefault || !registry.defaultProfile) {
    registry.defaultProfile = alias;
  }

  await writeProfileRegistry(registry, registryPath);
  return profile;
}
