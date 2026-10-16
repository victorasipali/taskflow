export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

/** Row shape of public.projects */
export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string;
  created_at: string;
  updated_at: string;
}

/** A project plus derived counts returned by the list query. */
export interface ProjectWithCounts extends Project {
  task_count: number;
  done_count: number;
}

/** Row shape of public.tasks — every task belongs to exactly one project. */
export interface Task {
  id: string;
  user_id: string;
  project_id: string;
  title: string;
  notes: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_at: string | null;
  remind: boolean;
  created_at: string;
  updated_at: string;
}

/** A task with the name and colour of its project joined in, for list screens. */
export interface TaskWithProject extends Task {
  project: Pick<Project, 'id' | 'name' | 'color'> | null;
}

export interface ProjectInput {
  name: string;
  description: string | null;
  color: string;
}

export interface TaskInput {
  project_id: string;
  title: string;
  notes: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_at: string | null;
  remind: boolean;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface CurrentWeather {
  temperature: number;
  apparentTemperature: number;
  windSpeed: number;
  precipitation: number;
  weatherCode: number;
  isDay: boolean;
}

export interface DailyForecast {
  date: string;
  weatherCode: number;
  maxTemp: number;
  minTemp: number;
  precipitationProbability: number;
}

export interface WeatherReport {
  placeName: string | null;
  current: CurrentWeather;
  daily: DailyForecast[];
  fetchedAt: string;
}

export type TemperatureUnit = 'celsius' | 'fahrenheit';

export interface Preferences {
  temperatureUnit: TemperatureUnit;
  defaultReminderMinutes: number;
  hideCompleted: boolean;
}

/** Result of a list read: when the network fails we fall back to the cached copy. */
export interface CachedResult<T> {
  items: T;
  fromCache: boolean;
  savedAt: string | null;
}
