type preference = {
  queue: string[];
  position: number;
  volume: number;
};

const key = "music-v1";

export function savePreference(p: Partial<preference>) {
  const prev = loadPreference();
  const next = {
    ...prev,
    ...p,
  };

  localStorage.setItem(key, JSON.stringify(next));
}

export function loadPreference(): preference {
  const ls = localStorage.getItem(key);
  if (ls === null) {
    return {
      queue: [],
      position: 0,
      volume: 20,
    };
  }

  const p = JSON.parse(ls);
  return p as preference;
}

export function clearPreference() {
  localStorage.removeItem(key);
}
