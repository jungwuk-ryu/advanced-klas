/**
 * 페이지 이름: 홈
 * 페이지 주소: https://klas.kw.ac.kr/std/cmn/frame/Frame.do
 */

import handleTimeTable from './timetable';

export default () => {
  // 타임테이블 시간 그리기
  handleTimeTable();
  document.querySelector('.scheduletitle > select').addEventListener('change', handleTimeTable);

  // 과목별 NOTICE와 수강과목을 한 라인에 추가
  (async () => {
    let cards = document.querySelector('.subjectbox').querySelectorAll('.card');
    let cardRow = document.createElement('div');
    cardRow.setAttribute('class', 'card-row');
    cardRow.setAttribute('test', '');
    cards[1].parentNode.insertBefore(cardRow, cards[1].nextSibling); // Row 추가
    cardRow.appendChild(cards[2]); // 과목별 NOTICE
    cardRow.appendChild(cards[1]); // 수강과목
    cards[2].setAttribute('style', 'flex: 4; margin-right: 5px;'); // 과목별 NOTICE
    cards[1].setAttribute('style', 'flex: 9;'); // 수강과목
  })();

  // 시간표, 캘린더 전환
  (async () => {
    const btn = document.createElement('button');
    btn.innerText = '📅 일정 보기';
    btn.style.width = '100%';
    btn.style.marginBottom = '5px';
    btn.setAttribute('class', 'btn2 btn-learn');
    btn.setAttribute('id', 'toggleButton');

    const subjectBox = document.querySelector('.subjectbox');
    const schedule = subjectBox.querySelector('.scheduletitle').parentElement;
    const calendar = subjectBox.querySelector('.calnotice').parentElement;
    schedule.parentNode.insertBefore(calendar, schedule);
    calendar.parentNode.insertBefore(btn, calendar);
    calendar.style.display = 'none';

    const toggleButton = document.getElementById('toggleButton');

    toggleButton.addEventListener('click', function () {
      if (schedule.style.display === 'none') {
        schedule.style.display = 'block';
        calendar.style.display = 'none';
        btn.innerText = '📅 일정 보기';
      }
      else {
        schedule.style.display = 'none';
        calendar.style.display = 'block';
        btn.innerText = '📚 시간표 보기';
      }
    });
  })();

  // 기말 평가 안내문 표시
  (async () => {
    const settings = {
      nowYear: 2020,
      nowSemester: 1,
      startDate: '2020-06-15',
      endDate: '2020-06-26',
      noticeURL: 'https://www.kw.ac.kr/ko/life/notice.jsp?BoardMode=view&DUID=33096',
    };

    if (!settings.startDate || !settings.endDate) {
      return;
    }

    const startDate = new Date(settings.startDate + ' 00:00:00');
    const endDate = new Date(settings.endDate + ' 23:59:59');
    const nowDate = new Date();

    if (nowDate < startDate || nowDate > endDate) {
      return;
    }

    const postDatas = {
      thisYear: settings.nowYear,
      hakgi: settings.nowSemester,
      termYn: 'Y',
    };

    await axios.post('/std/cps/inqire/LctreEvlTermCheck.do').then((response) => { postDatas['judgeChasu'] = response.data.judgeChasu; });
    await axios.post('/std/cps/inqire/LctreEvlGetHakjuk.do').then((response) => { postDatas['info'] = response.data; });

    let totalCount = 0;
    let remainingCount = 0;

    await axios.post('/std/cps/inqire/LctreEvlsugangList.do', postDatas).then((response) => {
      totalCount = response.data.length;
      remainingCount = response.data.filter((v) => v.judgeChasu === 'N').length;
    });

    if (remainingCount === 0) {
      return;
    }

    // 렌더링
    $('.subjectbox').prepend(`
       <div class="card card-body mb-4">
         <div class="bodtitle">
           <p class="title-text">수업 평가 안내</p>
         </div>
         <div>
           <div>
             <div><strong>${settings.startDate}</strong>부터 <strong>${settings.endDate}</strong>까지 기말 수업 평가를 실시합니다.</div>
             <div style="color: red">수업 평가를 하지 않으면 성적 공개 기간에 해당 과목의 성적을 확인할 수 없으니 잊지 말고 반드시 평가해 주세요.</div>
             <div><strong>${totalCount}개</strong> 중 <strong>${remainingCount}개</strong>의 수업 평가가 남았습니다.</div>
           </div>
           <div style="margin-top: 20px">
             <button type="button" class="btn2 btn-learn" onclick="linkUrl('/std/cps/inqire/LctreEvlStdPage.do')">수업 평가</button>
             <a href="${settings.noticeURL}" target="_blank"><button type="button" class="btn2 btn-gray">공지사항 확인</button></a>
           </div>
         </div>
       </div>
     `);
  })();

  // 수강 과목 현황의 마감 정보 표시
  (() => {
    // 변경된 과목에 따라 마감 정보 업데이트
    const updateDeadline = async (subjects) => {
      const promises = [];
      const deadline = {};
      let isExistDeadline = false;

      // 현재 수강 중인 과목 얻기
      for (const subject of subjects) {
        deadline[subject.subj] = {
          subjectName: subject.subjNm,
          subjectCode: subject.subj,
          yearSemester: subject.yearhakgi,
          lecture: {
            remainingTime: Infinity,
            remainingCount: 0,
            totalCount: 0,
          },
          homework: {
            remainingTime: Infinity,
            remainingCount: 0,
            totalCount: 0,
          },
          teamProject: {
            remainingTime: Infinity,
            remainingCount: 0,
            totalCount: 0,
          },
        };

        // 온라인 강의를 가져올 주소 설정
        promises.push(axios.post('/std/lis/evltn/SelectOnlineCntntsStdList.do', {
          selectSubj: subject.subj,
          selectYearhakgi: subject.yearhakgi,
          selectChangeYn: 'Y',
        }));

        // 과제를 가져올 주소 설정
        promises.push(axios.post('/std/lis/evltn/TaskStdList.do', {
          selectSubj: subject.subj,
          selectYearhakgi: subject.yearhakgi,
          selectChangeYn: 'Y',
        }));

        // 팀 프로젝트를 가져올 주소 설정
        promises.push(axios.post('/std/lis/evltn/PrjctStdList.do', {
          selectSubj: subject.subj,
          selectYearhakgi: subject.yearhakgi,
          selectChangeYn: 'Y',
        }));
      }

      // 온라인 강의 파싱 함수
      const parseLecture = (subjectCode, responseData) => {
        const nowDate = new Date();

        for (const lecture of responseData) {
          if (lecture.evltnSe !== 'lesson' || lecture.prog === 100) {
            continue;
          }

          const endDate = new Date(lecture.endDate + ':59');
          const hourGap = Math.floor((endDate - nowDate) / 3600000);

          if (hourGap < 0) {
            continue;
          }

          if (deadline[subjectCode].lecture.remainingTime > hourGap) {
            deadline[subjectCode].lecture.remainingTime = hourGap;
            deadline[subjectCode].lecture.remainingCount = 1;
          }
          else if (deadline[subjectCode].lecture.remainingTime === hourGap) {
            deadline[subjectCode].lecture.remainingCount++;
          }

          deadline[subjectCode].lecture.totalCount++;
          isExistDeadline = true;
        }
      };

      /**
        * 과제 파싱 함수
        * @param {String} subjectCode
        * @param {Object} responseData
        * @param {String} homeworkType  HW(Personal Homework), TP(Team Project)
        */
      const parseHomework = (subjectCode, responseData, homeworkType = 'HW') => {
        const nowDate = new Date();

        for (const homework of responseData) {
          if (homework.submityn === 'Y') {
            continue;
          }

          let endDate = new Date(homework.expiredate);
          let hourGap = Math.floor((endDate - nowDate) / 3600000);

          if (hourGap < 0) {
            if (!homework.reexpiredate) {
              continue;
            }

            // 추가 제출 기한
            endDate = new Date(homework.reexpiredate);
            hourGap = Math.floor((endDate - nowDate) / 3600000);

            if (hourGap < 0) {
              continue;
            }
          }

          if (homeworkType === 'HW') {
            if (deadline[subjectCode].homework.remainingTime > hourGap) {
              deadline[subjectCode].homework.remainingTime = hourGap;
              deadline[subjectCode].homework.remainingCount = 1;
            }
            else if (deadline[subjectCode].homework.remainingTime === hourGap) {
              deadline[subjectCode].homework.remainingCount++;
            }

            deadline[subjectCode].homework.totalCount++;
          }
          else if (homeworkType === 'TP') {
            if (deadline[subjectCode].teamProject.remainingTime > hourGap) {
              deadline[subjectCode].teamProject.remainingTime = hourGap;
              deadline[subjectCode].teamProject.remainingCount = 1;
            }
            else if (deadline[subjectCode].teamProject.remainingTime === hourGap) {
              deadline[subjectCode].teamProject.remainingCount++;
            }

            deadline[subjectCode].teamProject.totalCount++;
          }
          isExistDeadline = true;
        }
      };

      // 해당 과목의 마감 정보 얻기
      await axios.all(promises).then((results) => {
        for (const response of results) {
          const subjectCode = JSON.parse(response.config.data).selectSubj;

          switch (response.config.url) {
            case '/std/lis/evltn/SelectOnlineCntntsStdList.do':
              parseLecture(subjectCode, response.data);
              break;

            case '/std/lis/evltn/TaskStdList.do':
              parseHomework(subjectCode, response.data, 'HW');
              break;

            case '/std/lis/evltn/PrjctStdList.do':
              parseHomework(subjectCode, response.data, 'TP');
              break;
          }
        }
      });

      // 마감이 빠른 순으로 정렬
      const sortedDeadline = Object.values(deadline).sort((left, right) => {
        const minLeft = left.lecture.remainingTime < left.lecture.remainingTime ? left.lecture : left.homework;
        const minRight = right.lecture.remainingTime < right.lecture.remainingTime ? right.lecture : right.homework;

        if (minLeft.remainingTime !== minRight.remainingTime) {
          return minLeft.remainingTime - minRight.remainingTime;
        }

        if (minLeft.remainingCount !== minRight.remainingCount) {
          return minRight.remainingCount - minLeft.remainingCount;
        }

        return (right.lecture.remainingCount + right.homework.remainingCount) - (left.lecture.remainingCount + left.homework.remainingCount);
      });

      // 내용 생성 함수
      const createContent = (name, info) => {
        if (info.remainingTime === Infinity) {
          return '';
        }

        const remainingDay = Math.floor(info.remainingTime / 24);
        const remainingHour = info.remainingTime % 24;

        if (remainingDay === 0) {
          if (remainingHour === 0) {
            return `<span style="font-weight: bold; color: red; margin-right: 10px;" class="remain-soon">${info.totalCount}개의 ${name} 중 ${info.remainingCount}개가 곧 마감입니다. 😱</span>`;
          }
          else {
            return `<span style=" font-weight: bolder; color: red; margin-right: 10px;" class="remain-hour">${info.totalCount}개의 ${name} 중 <strong>${info.remainingCount}개</strong>가 <strong>${remainingHour}시간 후</strong> 마감입니다. 😭</span>`;
          }
        }
        else if (remainingDay === 1) {
          return `<span style="color: red; margin-right: 10px;" class="remain-today">${info.totalCount}개의 ${name} 중 <strong>${info.remainingCount}개</strong>가 <strong>1일 후</strong> 마감입니다. 😥</span>`;
        }
        else {
          return `<span style="color: blue; margin-right: 10px;" class="will-remain">${info.totalCount}개의 ${name} 중 <strong>${info.remainingCount}개</strong>가 <strong>${remainingDay}일 후</strong> 마감입니다.</span>`;
        }
      };

      // HTML 코드 생성
      const trCode = () => {
        var acc = '';
        for (let cur of Object.values(deadline)) {
          let lecture = createContent('강의', cur.lecture);
          let homework = createContent('과제', cur.homework);
          let teamProject = createContent('팀 프로젝트', cur.teamProject);

          if (lecture !== '' || homework !== '' || teamProject !== '') {
            acc += `<!--subj:${cur.subjectName}-->
           <tr style="border-bottom: 1px solid #dce3eb; height: 30px">
             <td>
               <span style="cursor: pointer" onclick="appModule.goLctrumBoard('/std/lis/evltn/OnlineCntntsStdPage.do', '${cur.yearSemester}', '${cur.subjectCode}')">
                 ${lecture}
               </span>
             </td>
             <td>
               <span style="cursor: pointer" onclick="appModule.goLctrumBoard('/std/lis/evltn/TaskStdPage.do', '${cur.yearSemester}', '${cur.subjectCode}')">
                 ${homework}
               <span>
             </td>
             <td>
               <span style="cursor: pointer" onclick="appModule.goLctrumBoard('/std/lis/evltn/PrjctStdPage.do', '${cur.yearSemester}', '${cur.subjectCode}')">
                 ${teamProject}
               <span>
             </td>
           </tr>
         `;
          }
        }

        return acc;
      };

      // 렌더링
      if (isExistDeadline) {
        let subjectList = document.querySelector('.subjectlist').querySelectorAll('li');

        for (let subjEle of trCode().split('<!--subj:')) {
          if (subjEle.indexOf('appModule.goLctrumBoard') === -1) continue;
          let tokens = subjEle.split('-->');
          let lectureName = tokens[0];

          subjectList.forEach((value) => {
            if (value.innerText.indexOf(lectureName) !== -1) {
              let leftContainer = value.querySelector('.left');

              let container = leftContainer.querySelector('#subjBox');
              if (container === undefined || container === null) {
                container = document.createElement('div');
                container.setAttribute('id', 'subjBox');
                leftContainer.append(container);
              }

              container.innerHTML = tokens[1];
            }
          });
        }
      }
    };

    appModule.$watch('atnlcSbjectList', (watchValue) => {
      updateDeadline(watchValue);
    });

    // 모든 정보를 불러올 때까지 대기
    const waitTimer = setInterval(() => {
      if (appModule && appModule.atnlcSbjectList.length > 0) {
        clearInterval(waitTimer);
        updateDeadline(appModule.atnlcSbjectList);
      }
    }, 100);
  })();
};
