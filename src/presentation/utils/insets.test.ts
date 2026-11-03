import { getHorizontalSafeInsets } from "./insets";

describe("getHorizontalSafeInsets", () => {
  it("maps left to paddingStart and right to paddingEnd in LTR, capping excessive insets", () => {
    const insets = { left: 16, right: 84 };
    const result = getHorizontalSafeInsets(insets, false);

    expect(result).toEqual({
      paddingStart: 16,
      paddingEnd: 24,
    });
  });

  it("maps right to paddingStart and left to paddingEnd in RTL, capping excessive insets", () => {
    const insets = { left: 16, right: 84 };
    const result = getHorizontalSafeInsets(insets, true);

    expect(result).toEqual({
      paddingStart: 24,
      paddingEnd: 16,
    });
  });

  it("respects custom maxPadding override", () => {
    const insets = { left: 16, right: 84 };
    expect(getHorizontalSafeInsets(insets, false, 0, 84)).toEqual({
      paddingStart: 16,
      paddingEnd: 84,
    });
  });

  it("handles zero insets", () => {
    const insets = { left: 0, right: 0 };
    expect(getHorizontalSafeInsets(insets, false)).toEqual({
      paddingStart: 0,
      paddingEnd: 0,
    });
    expect(getHorizontalSafeInsets(insets, true)).toEqual({
      paddingStart: 0,
      paddingEnd: 0,
    });
  });

  it("applies minPadding when insets are smaller than minPadding", () => {
    const insets = { left: 8, right: 0 };
    expect(getHorizontalSafeInsets(insets, false, 16)).toEqual({
      paddingStart: 16,
      paddingEnd: 16,
    });
    expect(getHorizontalSafeInsets(insets, true, 16)).toEqual({
      paddingStart: 16,
      paddingEnd: 16,
    });
  });
});
