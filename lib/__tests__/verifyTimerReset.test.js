describe('Hand Test Timer Reset & Completion Safety', () => {
  let timerId = null;
  let isTimerActive = false;
  let isRunning = false;
  let countdown = 7;

  function stopAndClearVerifyTimer(options = { resetCountdown: true }) {
    const shouldReset = options?.resetCountdown ?? true;
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
    isTimerActive = false;
    isRunning = false;
    if (shouldReset) {
      countdown = 7;
    }
  }

  function startTimer() {
    stopAndClearVerifyTimer({ resetCountdown: true });
    isRunning = true;
    countdown = 7;
    isTimerActive = true;
  }

  function closeModal() {
    stopAndClearVerifyTimer({ resetCountdown: true });
  }

  beforeEach(() => {
    jest.useFakeTimers();
    timerId = null;
    isTimerActive = false;
    isRunning = false;
    countdown = 7;
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  test('resets countdown to 7 when modal is closed before 7 seconds completion', () => {
    startTimer();
    expect(countdown).toBe(7);
    expect(isRunning).toBe(true);

    // Simulate tick to 4 seconds
    countdown = 4;

    closeModal();
    expect(countdown).toBe(7);
    expect(isRunning).toBe(false);
    expect(isTimerActive).toBe(false);
  });

  test('preserves 0 countdown on normal completion until modal dismissal', () => {
    startTimer();

    // On timer completion (0s)
    countdown = 0;
    stopAndClearVerifyTimer({ resetCountdown: false });

    expect(countdown).toBe(0); // Resolution UI shown
    expect(isRunning).toBe(false);

    // When modal is dismissed
    closeModal();
    expect(countdown).toBe(7); // Next open starts fresh at 7
  });

  test('reopening always starts fresh at 7 seconds', () => {
    startTimer();
    countdown = 3;
    closeModal();

    startTimer();
    expect(countdown).toBe(7);
    expect(isRunning).toBe(true);
  });
});
