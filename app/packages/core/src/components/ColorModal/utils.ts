import { isValidColor } from "@fiftyone/looker/src/overlays/util";
import {
  ColorSchemeInput,
  ColorscaleInput,
  ColorscaleListInput,
  MaskColorInput,
} from "@fiftyone/relay";
import colorString from "color-string";
import { isEmpty, xor } from "lodash";

// Masataka Okabe and Kei Ito have proposed a palette of 8 colors on their
// website Color Universal Design (CUD). This palette is a “Set of colors that
// is unambiguous both to colorblinds and non-colorblinds”.
//
// https://jfly.uni-koeln.de/color/
export const colorBlindFriendlyPalette = [
  "#E69F00", // orange
  "#56b4e9", // skyblue
  "#009e74", // bluegreen
  "#f0e442", // yellow
  "#0072b2", // blue
  "#d55e00", // vermillion
  "#cc79a7", // reddish purple
];

export enum ACTIVE_FIELD {
  JSON = "JSON editor",
  GLOBAL = "Global settings",
  LABEL_TAGS = "label_tags",
}

// disregard the order
export const isSameArray = (a: readonly unknown[], b: readonly unknown[]) => {
  return isEmpty(xor(a, b));
};

export const isString = (v: unknown) => typeof v === "string";
export const isObject = (v: unknown) => typeof v === "object" && v != null;
export const isBoolean = (v: unknown) => typeof v === "boolean";

const getValidLabelColors = (labelColors: unknown[]) => {
  return labelColors?.filter((x) => {
    return (
      x &&
      isObject(x) &&
      isString(x["value"]) &&
      x["value"] !== "" &&
      isString(x["color"])
    );
  }) as { value: string; color: string }[];
};

// should return a valid customize color object that can be used to setCustomizeColor
export const validateJSONSetting = (
  json: ColorSchemeInput["fields"]
): ColorSchemeInput["fields"] => {
  const filtered =
    json?.filter((s) => s && isObject(s) && isString(s["path"])) || [];

  const f = filtered.map((input) => ({
    path: input["path"],
    fieldColor: input["fieldColor"] ?? null,
    colorByAttribute: isString(input["colorByAttribute"])
      ? input["colorByAttribute"]
      : null,
    valueColors: Array.isArray(input["valueColors"])
      ? getValidLabelColors(input["valueColors"])
      : [],
    maskTargetsColors: Array.isArray(input["maskTargetsColors"])
      ? getValidMaskColors(input.maskTargetsColors)
      : [],
  }));

  return f.filter((x) => {
    const hasFieldSetting = x.fieldColor;
    const hasAttributeColor = x.colorByAttribute;
    const hasLabelColors = x.valueColors?.length > 0;
    const hasTargetMasks =
      x.maskTargetsColors && x.maskTargetsColors?.length > 0;

    return (
      hasFieldSetting || hasAttributeColor || hasLabelColors || hasTargetMasks
    );
  });
};

export const validateLabelTags = (
  obj: ColorSchemeInput["labelTags"]
): ColorSchemeInput["labelTags"] => {
  if (typeof obj === "object" && obj !== null) {
    const f = {
      fieldColor: obj["fieldColor"] ?? null,
      valueColors: Array.isArray(obj["valueColors"])
        ? getValidLabelColors(obj["valueColors"])
        : [],
    };

    return f.fieldColor || f.valueColors?.length > 0 ? f : null;
  }
};

const getValidMaskColors = (maskColors: unknown[]) => {
  const r = maskColors
    ?.filter((x) => {
      return (
        x &&
        isObject(x) &&
        typeof Number(x["intTarget"]) == "number" &&
        Number(x["intTarget"]) >= 0 &&
        Number(x["intTarget"]) <= 255 &&
        isString(x["color"]) &&
        isValidColor(x?.color)
      );
    })
    .map((y: unknown) => ({
      intTarget: Number(y?.intTarget),
      color: y?.color,
    })) as MaskColorInput[];

  return r.length > 0 ? r : null;
};

export const validateMaskColor = (
  arr: any
): ColorSchemeInput["defaultMaskTargetsColors"] => {
  return Array.isArray(arr) ? getValidMaskColors(arr) : null;
};

export const getDisplayName = (path: ACTIVE_FIELD | { path: string }) => {
  if (typeof path === "object") {
    if (path.path === "tags") {
      return "sample tags";
    }
    if (path.path === "_label_tags") {
      return "label tags";
    }
    return path.path;
  }
  return path;
};

export const getRandomColorFromPool = (pool: readonly string[]): string =>
  pool[Math.floor(Math.random() * pool.length)];

export const validateIntMask = (value: number) => {
  if (!value || value > 255 || value < 1 || !Number.isInteger(value)) {
    return false;
  }
  return true;
};

export const getRGBColorFromPool = (pool: readonly string[]): string => {
  const color = getRandomColorFromPool(pool);
  const rgb = colorString.get.rgb(color).slice(0, 3);
  return colorString.to.rgb(rgb);
};

export const convertToRGB = (color: string) => {
  if (!isValidColor(color)) return "";
  const rgb = colorString.get.rgb(color).slice(0, 3);
  return colorString.to.rgb(rgb);
};

export const isValidMaskInput = (input: MaskColorInput[]) => {
  let result = true;
  input.forEach((item: MaskColorInput) => {
    if (!item || [null, undefined].includes(item.intTarget)) {
      result = false;
    }
  });
  return result;
};

export const isValidFloatInput = (input: ColorscaleListInput[]) => {
  let result = true;
  input.forEach((item) => {
    if (!item || [null, undefined].includes(item.value)) {
      result = false;
    }
  });
  return result;
};

// on Json viewer, do not display the rgb results of colorscale
export const simplifyColorscale = (input: ColorscaleInput[]) => {
  if (!input || input.length == 0) {
    return null;
  }
  return input.map((x) => ({
    path: x.path,
    name: x.name,
    list: x.list,
  }));
};
