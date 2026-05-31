export type MatchableRelationshipEvent = {
  related_person: string | null;
  compass_updates: Array<{
    relationship_type: string;
    nickname: string;
  }>;
};

export type MatchableRelationshipProfile = {
  nickname: string;
  relationship_type: string;
};

export function matchesProfile(event: MatchableRelationshipEvent, profile: MatchableRelationshipProfile) {
  const relatedPerson = event.related_person?.trim();
  const profileNickname = profile.nickname.trim();
  const hasProfileNickname = isUsableProfileNickname(profileNickname);
  const plainNicknameMatch = hasProfileNickname && relatedPerson === profileNickname;
  const updateNicknameMatch =
    hasProfileNickname && event.compass_updates.some((update) => update.nickname.trim() === profileNickname);

  if (plainNicknameMatch || updateNicknameMatch) return true;

  const plainTypeFallback =
    !isUsableEventNickname(relatedPerson, profile.relationship_type) && relatedPerson === profile.relationship_type;
  const updateTypeFallback = event.compass_updates.some(
    (update) =>
      !isUsableEventNickname(update.nickname, profile.relationship_type) &&
      update.relationship_type === profile.relationship_type,
  );

  return plainTypeFallback || updateTypeFallback;
}

function isUsableProfileNickname(value: string | null | undefined) {
  const normalized = value?.trim();
  return Boolean(normalized && !/^(未知|未命名|匿名|某人|无|暂无|unknown|n\/a|na|-|--|\?)$/i.test(normalized));
}

function isUsableEventNickname(value: string | null | undefined, relationshipType: string) {
  const normalized = value?.trim();
  return isUsableProfileNickname(normalized) && normalized !== relationshipType;
}
