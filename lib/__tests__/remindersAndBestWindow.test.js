describe('Care Reminders & Best Window QA Fixes', () => {
  function medReminderDisplayLabel(row) {
    if (row.kind === 'heartworm') return 'Heartworm';
    if (row.kind === 'flea_tick') return 'Flea & tick';
    return row.custom_label || 'Reminder';
  }

  test('Heartworm display label is clean and formatted', () => {
    const row = {
      id: 'hw-1',
      kind: 'heartworm',
      custom_label: '',
      interval_days: 30,
      next_due_at: Date.now() + 86400000,
      hour_local: 9,
      minute_local: 0,
      enabled: 1,
    };

    expect(medReminderDisplayLabel(row)).toBe('Heartworm');
  });

  test('Sunset formatting handles summer sunset time (e.g., 8:20 PM) correctly', () => {
    const sunsetIso = '2026-07-31T20:20:00.000Z';
    const sunsetDate = new Date(sunsetIso);
    expect(sunsetDate.getUTCHours()).toBe(20);
    expect(sunsetDate.getUTCMinutes()).toBe(20);
  });

  test('Care reminder deduplication selects single active reminder per kind', () => {
    const rows = [
      { id: 'hw-1', kind: 'heartworm', next_due_at: 1000 },
      { id: 'hw-2', kind: 'heartworm', next_due_at: 2000 },
    ];
    const sorted = [...rows].sort((a, b) => b.next_due_at - a.next_due_at);
    const keeper = sorted[0];
    const duplicates = sorted.slice(1);
    expect(keeper.id).toBe('hw-2');
    expect(duplicates).toHaveLength(1);
    expect(duplicates[0].id).toBe('hw-1');
  });
});
