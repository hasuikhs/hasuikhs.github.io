import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

const renderAt = (path: string) => render(
  <MemoryRouter initialEntries={ [ path ] }>
    <App />
  </MemoryRouter>
);

test('hub lists the Yeoun app with a link to its page', () => {
  renderAt('/');
  expect(screen.getByRole('heading', { name: '여운' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: '자세히 보기' })).toHaveAttribute('href', '/yeoun');
  expect(screen.queryByText(/khasui|1인 개발자/)).not.toBeInTheDocument();
});

test('Yeoun page links to the Play Store listing and policies', () => {
  renderAt('/yeoun');
  expect(screen.getByRole('link', { name: /Google Play/ })).toHaveAttribute(
    'href',
    'https://play.google.com/store/apps/details?id=com.hskim.yeoun'
  );
  expect(screen.getByRole('img', { name: 'Google Play에서 다운로드' })).toHaveAttribute(
    'src',
    '/badges/google-play-ko.png'
  );
  expect(screen.getByRole('link', { name: '개인정보처리방침' })).toBeInTheDocument();
});

test('Yeoun page introduces ticket scanning', () => {
  renderAt('/yeoun');
  expect(screen.getByRole('heading', { name: '티켓 사진으로 빠르게 기록' })).toBeInTheDocument();
});

test('unknown paths render the not-found page', () => {
  renderAt('/nope');
  expect(screen.getByRole('heading', { name: '페이지를 찾을 수 없습니다' })).toBeInTheDocument();
});
