import routes from './routes';
import {
  insertLibrary,
} from './utils/dom';

// 확장 프로그램은 load가 필요없습니다
(() => {
  const dependencies: string[] = [];
  // const dependencies = [
  //   'https://cdnjs.cloudflare.com/ajax/libs/jquery-modal/0.9.1/jquery.modal.min.js',
  //   'https://cdnjs.cloudflare.com/ajax/libs/jquery-modal/0.9.1/jquery.modal.min.css',
  //   'https://cdn.jsdelivr.net/npm/chart.js@2.9.3/dist/Chart.min.js'
  // ];

  // 의존성 삽입
  for (const url of dependencies) {
    insertLibrary(url);
  }

  // 메인 함수 실행
  if (Object.prototype.hasOwnProperty.call(routes, location.pathname)) {
    routes[location.pathname]();
  }
  routes['*']();

  // KLAS Helper 사용 여부 문구 추가
  $('.navtxt').prepend(`
    <span style="margin-right: 20px">
      <a href="https://github.com/jungwuk-ryu/advanced-klas" target="_blank" rel="noopener">👑 Advanced KLAS</a>
    </span>
  `);

  // 위로 가기 버튼 위치 고정
  $('.btnup').css({
    bottom: '30px',
    position: 'fixed',
    right: '30px',
  });

  // 로그인 세션 유지
  setInterval(() => { fetch('/'); }, 600000);
})();
