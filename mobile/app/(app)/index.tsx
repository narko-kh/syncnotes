/**
 * صفحه‌ی اصلی: لیست وظایف و یادداشت‌ها
 * همه‌چیز (جستجو، فیلتر، مرتب‌سازی) روی نسخه‌ی محلی انجام میشه،
 * پس سریعه و آفلاین هم کار می‌کنه.
 */
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { EmptyState } from "@/components/EmptyState";
import { IconButton } from "@/components/IconButton";
import { ItemRow } from "@/components/ItemRow";
import { Screen } from "@/components/Screen";
import { SearchBar } from "@/components/SearchBar";
import { SegmentedControl } from "@/components/SegmentedControl";
import { SyncPill } from "@/components/SyncPill";
import { TagChip } from "@/components/TagChip";
import type { AppLanguage, Item, ItemType } from "@/domain/types";
import { useDebounced } from "@/hooks/useDebounced";
import { syncNow } from "@/services/sync/syncEngine";
import { useItemsStore } from "@/stores/itemsStore";
import { spacing, typography } from "@/theme/tokens";
import { useTheme } from "@/theme/useTheme";

type TypeFilter = "ALL" | ItemType;

export default function ItemsScreen() {
  const { t, i18n } = useTranslation();
  const { palette } = useTheme();
  const router = useRouter();
  const language: AppLanguage = i18n.language === "fa" ? "fa" : "en";

  const itemsMap = useItemsStore((s) => s.items);
  const outbox = useItemsStore((s) => s.outbox);

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const search = useDebounced(query.trim().toLowerCase(), 200);

  // شناسه‌ی آیتم‌هایی که هنوز به سرور نرسیدن
  const pendingIds = useMemo(
    () => new Set(outbox.map((op) => op.itemId)),
    [outbox],
  );

  // همه‌ی آیتم‌ها: وظایف باز اول، بعد بر اساس آخرین تغییر
  const allItems = useMemo(
    () =>
      Object.values(itemsMap).sort((a, b) => {
        if (a.isDone !== b.isDone) return a.isDone ? 1 : -1; // انجام‌شده‌ها آخر
        if (a.dueAt && b.dueAt) return a.dueAt.localeCompare(b.dueAt); // موعد نزدیک‌تر بالاتر
        if (a.dueAt || b.dueAt) return a.dueAt ? -1 : 1; // دارای موعد قبل از بدون موعد
        return b.updatedAt.localeCompare(a.updatedAt);
      }),
    [itemsMap],
  );

  // همه‌ی برچسب‌های موجود برای نوار فیلتر
  const allTags = useMemo(
    () => [...new Set(allItems.flatMap((item) => item.tags))].sort(),
    [allItems],
  );

  // لیست نهایی بعد از جستجو و فیلتر
  const visibleItems = useMemo(
    () =>
      allItems.filter((item) => {
        if (typeFilter !== "ALL" && item.type !== typeFilter) return false;
        if (tagFilter && !item.tags.includes(tagFilter)) return false;
        if (
          search &&
          !`${item.title} ${item.content}`.toLowerCase().includes(search)
        )
          return false;
        return true;
      }),
    [allItems, typeFilter, tagFilter, search],
  );

  const isFiltering =
    typeFilter !== "ALL" || tagFilter !== null || search.length > 0;

  const openItem = useCallback(
    (id: string) => router.push({ pathname: "/editor", params: { id } }),
    [router],
  );

  const toggleDone = useCallback((id: string, isDone: boolean) => {
    useItemsStore.getState().updateLocal(id, { isDone: !isDone });
  }, []);

  // نگه داشتن روی یک سطر: حذف با تأیید
  const confirmDelete = useCallback(
    (id: string) => {
      Alert.alert(t("list.deleteTitle"), t("list.deleteBody"), [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: () => useItemsStore.getState().removeLocal(id),
        },
      ]);
    },
    [t],
  );

  // کشیدن لیست به پایین: همگام‌سازی دستی
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await syncNow();
    } finally {
      setRefreshing(false);
    }
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Item }) => (
      <ItemRow
        item={item}
        isPending={pendingIds.has(item.id)}
        language={language}
        onPress={openItem}
        onToggle={toggleDone}
        onLongPress={confirmDelete}
      />
    ),
    [pendingIds, language, openItem, toggleDone, confirmDelete],
  );

  return (
    <Screen>
      {/* هدر: عنوان، وضعیت همگام‌سازی و تنظیمات */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text
            style={[typography.title, { color: palette.text }]}
            accessibilityRole="header"
          >
            {t("common.appName")}
          </Text>
          <SyncPill />
        </View>
        <IconButton
          icon="settings-outline"
          label={t("list.settings")}
          onPress={() => router.push("/settings")}
        />
      </View>

      {/* جستجو و فیلترها */}
      <View style={styles.controls}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder={t("list.searchPlaceholder")}
        />
        <SegmentedControl<TypeFilter>
          accessibilityLabel={t("list.filterAll")}
          value={typeFilter}
          onChange={setTypeFilter}
          options={[
            { value: "ALL", label: t("list.filterAll") },
            { value: "TASK", label: t("list.filterTasks") },
            { value: "NOTE", label: t("list.filterNotes") },
          ]}
        />
        {allTags.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tagRow}
            accessibilityLabel={t("list.tagFilter")}
          >
            {allTags.map((tag) => (
              <TagChip
                key={tag}
                label={tag}
                selected={tagFilter === tag}
                onPress={() =>
                  setTagFilter((current) => (current === tag ? null : tag))
                }
              />
            ))}
          </ScrollView>
        ) : null}
      </View>

      <FlatList
        data={visibleItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        extraData={pendingIds}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={palette.accent}
          />
        }
        ListEmptyComponent={
          isFiltering ? (
            <EmptyState
              icon="search-outline"
              title={t("list.emptyFilteredTitle")}
              body={t("list.emptyFilteredBody")}
            />
          ) : (
            <EmptyState
              icon="documents-outline"
              title={t("list.emptyTitle")}
              body={t("list.emptyBody")}
            />
          )
        }
      />

      {/* دکمه‌ی افزودن */}
      <Pressable
        onPress={() => router.push("/editor")}
        accessibilityRole="button"
        accessibilityLabel={t("list.newItem")}
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: palette.accent, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <Ionicons name="add" size={30} color={palette.onAccent} />
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  headerText: { gap: spacing.sm },
  controls: { gap: spacing.md, padding: spacing.lg },
  tagRow: { gap: spacing.sm },
  listContent: { paddingBottom: 110, flexGrow: 1 },
  fab: {
    position: "absolute",
    end: spacing.xl,
    bottom: spacing.xl,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
});
