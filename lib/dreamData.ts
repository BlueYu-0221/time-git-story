// 白日梦想家的数据处理（纯 TS，供 React 组件使用）

import { cnDate, todayISO } from './moneyData';
import { readStory, writeStory } from './storyStore';

export type Idea = { id: string; date: string; type: string; text: string };
export type Flag = {
  id: string;
  text: string;
  target: string;
  created: string;
  done: boolean;
};
export type Letter = { id: string; text: string; created: string; openAt: string };

export const DREAM_TYPES = ['奇思妙想', '做过的梦', '想成为的自己'];

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function patch(fn: (d: any) => void) {
  const d: any = readStory();
  if (!d) return;
  d.dream = d.dream || { ideas: [], flags: [], letters: [] };
  fn(d.dream);
  writeStory(d);
}

export function addIdea(type: string, text: string) {
  patch((d) => {
    d.ideas = d.ideas || [];
    d.ideas.push({ id: uid(), date: todayISO(), type, text });
  });
}

export function delIdea(id: string) {
  patch((d) => {
    d.ideas = (d.ideas || []).filter((e: Idea) => e.id !== id);
  });
}

export function addFlag(text: string, target: string) {
  patch((d) => {
    d.flags = d.flags || [];
    d.flags.push({ id: uid(), text, target, created: todayISO(), done: false });
  });
}

export function delFlag(id: string) {
  patch((d) => {
    d.flags = (d.flags || []).filter((f: Flag) => f.id !== id);
  });
}

export function toggleFlag(id: string) {
  patch((d) => {
    (d.flags || []).forEach((f: Flag) => {
      if (f.id === id) f.done = !f.done;
    });
  });
}

export function addLetter(text: string, openAt: string) {
  patch((d) => {
    d.letters = d.letters || [];
    d.letters.push({ id: uid(), text, created: todayISO(), openAt });
  });
}

export function delLetter(id: string) {
  patch((d) => {
    d.letters = (d.letters || []).filter((l: Letter) => l.id !== id);
  });
}

export function mockFlag(p: { text: string; created: string; left: number }) {
  return (
    '还记得吗——你曾在 ' +
    cnDate(p.created) +
    ' 立下：\n「' +
    p.text +
    '」\n距离它还有 ' +
    p.left +
    ' 天。今天可以为它做一件很小的事，小到只需要五分钟。'
  );
}
