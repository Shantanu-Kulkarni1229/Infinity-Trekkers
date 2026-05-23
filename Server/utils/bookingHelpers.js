const parseJsonMaybe = (value, fallback = []) => {
  if (value == null || value === "") {
    return fallback;
  }

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  }

  return fallback;
};

export const parseJsonArrayField = (value, fallback = []) => parseJsonMaybe(value, fallback);

export const normalizeMemberDiscountRules = (value) => {
  return parseJsonMaybe(value, []).map((item, index) => ({
    id: String(item.id ?? `${index}`),
    label: String(item.label ?? `Tier ${index + 1}`).trim(),
    minMembers: Number(item.minMembers ?? item.members ?? 0),
    discountType: item.discountType === "percentage" ? "percentage" : "perPerson",
    discountValue: Number(item.discountValue ?? item.value ?? 0),
  })).filter((item) => item.minMembers > 0 && item.discountValue > 0);
};

export const normalizeItinerary = (value) =>
  parseJsonMaybe(value, []).map((item, index) => ({
    day: Number(item.day ?? index + 1),
    title: String(item.title ?? "").trim(),
    description: String(item.description ?? "").trim(),
    meals: String(item.meals ?? "").trim(),
    accommodation: String(item.accommodation ?? "").trim(),
  }));

export const normalizeThingsToCarry = (value) =>
  parseJsonMaybe(value, []).map((item) =>
    typeof item === "string"
      ? { item: item.trim(), details: "", required: true }
      : {
          item: String(item.item ?? "").trim(),
          details: String(item.details ?? "").trim(),
          required: item.required ?? true,
        }
  );

export const normalizePickupLocations = (value) =>
  parseJsonMaybe(value, []).map((item) => ({
    city: String(item.city ?? "").trim(),
    location: String(item.location ?? item.pickupLocation ?? "").trim(),
    pickupTime: String(item.pickupTime ?? item.time ?? "").trim(),
    notes: String(item.notes ?? "").trim(),
  }));

export const normalizeDateWindows = (value, primaryStartDate, primaryEndDate) => {
  const windows = parseJsonMaybe(value, []).map((item) => ({
    label: String(item.label ?? item.title ?? "").trim(),
    startDate: item.startDate ? new Date(item.startDate) : null,
    endDate: item.endDate ? new Date(item.endDate) : null,
  }));

  if (primaryStartDate && primaryEndDate) {
    windows.unshift({
      label: "Primary Schedule",
      startDate: new Date(primaryStartDate),
      endDate: new Date(primaryEndDate),
    });
  }

  const normalized = windows.filter((window) => window.startDate instanceof Date && !Number.isNaN(window.startDate.getTime()) && window.endDate instanceof Date && !Number.isNaN(window.endDate.getTime()));

  return normalized.map((window) => ({
    label: window.label,
    startDate: window.startDate,
    endDate: window.endDate,
  }));
};

export const isMatchingDateWindow = (candidate, target) => {
  if (!candidate || !target) {
    return false;
  }

  const candidateStart = new Date(candidate.startDate).getTime();
  const candidateEnd = new Date(candidate.endDate).getTime();
  const targetStart = new Date(target.startDate).getTime();
  const targetEnd = new Date(target.endDate).getTime();

  return candidateStart === targetStart && candidateEnd === targetEnd;
};

export const normalizeTravelerDetails = (value, membersCount) => {
  const travelers = parseJsonMaybe(value, []).map((item) => ({
    name: String(item.name ?? "").trim(),
    phoneNumber: String(item.phoneNumber ?? item.phone ?? "").trim(),
  }));

  if (membersCount != null && travelers.length !== Number(membersCount)) {
    throw new Error("Traveler details must include one entry for each member");
  }

  return travelers;
};

export const resolveMemberDiscountRule = (memberDiscountRules, membersCount) => {
  const rules = Array.isArray(memberDiscountRules) ? memberDiscountRules : [];
  const eligibleRules = rules
    .filter((rule) => Number(rule?.minMembers) > 0 && Number(membersCount) >= Number(rule.minMembers))
    .sort((left, right) => Number(right.minMembers) - Number(left.minMembers));

  return eligibleRules[0] || null;
};

export const calculateMemberDiscountedPrice = (basePricePerMember, membersCount, memberDiscountRules) => {
  const rule = resolveMemberDiscountRule(memberDiscountRules, membersCount);

  if (!rule) {
    return {
      rule: null,
      pricePerMember: basePricePerMember,
      finalPrice: basePricePerMember * Number(membersCount || 0),
    };
  }

  const discountValue = Number(rule.discountValue) || 0;
  const discountPerMember = rule.discountType === "percentage"
    ? (basePricePerMember * discountValue) / 100
    : discountValue;

  const pricePerMember = Math.max(0, basePricePerMember - discountPerMember);
  return {
    rule,
    pricePerMember,
    finalPrice: pricePerMember * Number(membersCount || 0),
  };
};