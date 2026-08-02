describe('Verify Surface Timer Lifecycle & Safety Guardrails', () => {
  let timerId = null;
  let isTimerActive = false;
  let countdown = 7;
  let running = false;

  const stopAndClearTimer = () => {
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
    isTimerActive = false;
    running = false;
  };

  const startTimer = () => {
    // Guaranteed single-instance timer: clear any existing timer instance first
    stopAndClearTimer();

    running = true;
    countdown = 7;
    isTimerActive = true;

    let t = 7;
    timerId = setInterval(() => {
      t -= 1;
      countdown = Math.max(0, t);
      if (t <= 0) {
        stopAndClearTimer();
      }
    }, 1000);
  };

  beforeEach(() => {
    jest.useFakeTimers();
    stopAndClearTimer();
    countdown = 7;
  });

  afterEach(() => {
    stopAndClearTimer();
    jest.useRealTimers();
  });

  it('guarantees only one timer instance exists even if started repeatedly', () => {
    startTimer();
    const firstTimer = timerId;
    expect(firstTimer).not.toBeNull();
    expect(isTimerActive).toBe(true);

    // Rapid second start
    startTimer();
    const secondTimer = timerId;
    expect(secondTimer).not.toBeNull();
    expect(secondTimer).not.toBe(firstTimer);

    // Advance 3 seconds
    jest.advanceTimersByTime(3000);
    expect(countdown).toBe(4);
    expect(running).toBe(true);
  });

  it('clears intervals and resets state cleanly on timer completion', () => {
    startTimer();
    expect(running).toBe(true);

    // Advance 7 seconds to completion
    jest.advanceTimersByTime(7000);

    expect(countdown).toBe(0);
    expect(running).toBe(false);
    expect(isTimerActive).toBe(false);
    expect(timerId).toBeNull();
  });

  it('clears interval immediately when user closes or cancels modal', () => {
    startTimer();
    jest.advanceTimersByTime(3000);
    expect(countdown).toBe(4);

    // User taps close
    stopAndClearTimer();

    expect(timerId).toBeNull();
    expect(isTimerActive).toBe(false);
    expect(running).toBe(false);

    // Advancing time does not change state
    jest.advanceTimersByTime(5000);
    expect(countdown).toBe(4);
  });

  it('clears timer and resets state when app goes to background or lock screen', () => {
    startTimer();
    jest.advanceTimersByTime(2000);

    // App state transitions to background
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        if (isTimerActive) {
          stopAndClearTimer();
          countdown = 7;
        }
      }
    };

    handleAppStateChange('background');

    expect(timerId).toBeNull();
    expect(isTimerActive).toBe(false);
    expect(running).toBe(false);
    expect(countdown).toBe(7);
  });
});
