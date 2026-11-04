import React,{useEffect,useMemo,useRef,useState} from 'react';

const STORAGE='acl-roomgrid-18rooms-v1';
const rooms=['A1-203', 'A2-106', 'A2-107', 'A3-208', 'A3-209', 'B1-205', 'B1-206', 'B1-207', 'B2-104', 'B2-105', 'B3-301', 'C1-102', 'C1-103', 'C2-201', 'C2-202', 'C3-101', 'C3-102', 'D1-101'];
// End dates are exclusive; all sample reservations use non-overlapping date ranges.
const sampleRows=[
 ['A1-203','2026-11-09','2026-11-11','Peer tutoring','other'],
 ['A1-203','2026-11-13','2026-11-15','Architecture workshop','other'],
 ['A1-203','2026-11-17','2026-11-19','Group assignment','you'],
 ['A2-106','2026-11-10','2026-11-13','Seminar preparation','other'],
 ['A2-106','2026-11-16','2026-11-19','Study circle','other'],
 ['A2-107','2026-11-09','2026-11-10','Student club planning','you'],
 ['A2-107','2026-11-12','2026-11-15','Project demo rehearsal','other'],
 ['A2-107','2026-11-16','2026-11-19','Study meeting','other'],
 ['A3-208','2026-11-11','2026-11-14','Presentation practice','other'],
 ['A3-208','2026-11-16','2026-11-18','Tutorial group','other'],
 ['A3-209','2026-11-10','2026-11-12','Study session','other'],
 ['B1-205','2026-11-09','2026-11-11','Meeting','other'],
 ['B1-205','2026-11-13','2026-11-15','Team discussion','other'],
 ['B1-205','2026-11-16','2026-11-18','Course project','other'],
 ['B1-206','2026-11-11','2026-11-13','Exam revision','other'],
 ['B1-206','2026-11-17','2026-11-20','Debate practice','you'],
 ['B1-207','2026-11-10','2026-11-12','Group study','you'],
 ['B1-207','2026-11-16','2026-11-19','Engineering project','other'],
 ['B2-104','2026-11-09','2026-11-11','Weekly study group','you'],
 ['B2-104','2026-11-13','2026-11-15','Team planning','other'],
 ['B2-104','2026-11-17','2026-11-19','Workshop preparation','other'],
 ['B2-105','2026-11-12','2026-11-15','Club meeting','other'],
 ['B2-105','2026-11-16','2026-11-18','Student committee','other'],
 ['B3-301','2026-11-09','2026-11-10','Debate practice','other'],
 ['B3-301','2026-11-11','2026-11-13','Group preparation','other'],
 ['B3-301','2026-11-18','2026-11-20','Portfolio review','other'],
 ['C1-102','2026-11-10','2026-11-14','Capstone meeting','other'],
 ['C1-102','2026-11-16','2026-11-19','Revision session','other'],
 ['C1-103','2026-11-09','2026-11-12','Group project','other'],
 ['C1-103','2026-11-14','2026-11-16','Student society','you'],
 ['C2-201','2026-11-12','2026-11-15','Project sprint','other'],
 ['C2-201','2026-11-16','2026-11-19','Robotics club','other'],
 ['C2-202','2026-11-09','2026-11-11','Lab preparation','other'],
 ['C2-202','2026-11-18','2026-11-20','Teaching assistant session','other'],
 ['C3-101','2026-11-12','2026-11-14','Presentation rehearsal','you'],
 ['C3-101','2026-11-14','2026-11-16','Design workshop','other'],
 ['C3-101','2026-11-18','2026-11-20','Study group','other'],
 ['C3-102','2026-11-11','2026-11-15','Research meeting','other'],
 ['D1-101','2026-11-10','2026-11-13','Team check-in','other'],
 ['D1-101','2026-11-16','2026-11-18','Group assignment','you'],
];
const seed=sampleRows.map(([roomNumber,startDate,endDate,purpose,owner],index)=>({id:`demo-${index+1}`,roomNumber,startDate,endDate,purpose,owner}));
const formEmpty={roomNumber:'',startDate:'',endDate:'',purpose:''};
function read(){try{let a=JSON.parse(localStorage.getItem(STORAGE));return Array.isArray(a)?a:seed;}catch{return seed;}}
function addDays(iso,days){const t=new Date(`${iso}T12:00:00Z`);t.setUTCDate(t.getUTCDate()+days);return t.toISOString().slice(0,10);}
function human(iso){return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB',{timeZone:'UTC',day:'numeric',month:'short'});}
function weekDay(iso){return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB',{timeZone:'UTC',weekday:'short'});}
function issue(form,bookings,id){
 if(!form.roomNumber.trim()||!form.startDate||!form.endDate)return 'Complete the room and both dates.';
 if(form.endDate<=form.startDate)return 'End date must follow start date.';
 if(bookings.some(b=>b.id!==id&&b.roomNumber.toLowerCase()===form.roomNumber.trim().toLowerCase()&&form.startDate<b.endDate&&form.endDate>b.startDate))return 'This room is already booked for some of those dates.';
 return '';
}
export default function App(){
 const [bookings,setBookings]=useState(read);
 const [week,setWeek]=useState('2026-11-09');
 const [view,setView]=useState('');
 const [building,setBuilding]=useState('');
 const [slotError,setSlotError]=useState('');
 const [drag,setDrag]=useState(null);
 const dragRef=useRef(null);
 const [form,setForm]=useState({...formEmpty});
 const [editing,setEditing]=useState(null);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const [tab,setTab]=useState('Availability');
 useEffect(()=>localStorage.setItem(STORAGE,JSON.stringify(bookings)),[bookings]);
 const days=useMemo(()=>Array.from({length:7},(_,i)=>addDays(week,i)),[week]);
 const myBookings=bookings.filter(b=>b.owner==='you').sort((a,b)=>a.startDate.localeCompare(b.startDate));
 const buildings=[...new Set(rooms.map(room=>room[0]))];
 const buildingRooms=rooms.filter(room=>room[0]===building);
 const roomList=rooms.filter(r=>r===view);
 const occupied=(room,date)=>bookings.find(b=>b.roomNumber===room&&date>=b.startDate&&date<b.endDate);
 function pick(room,date){const booking=occupied(room,date);if(booking){setSlotError(booking.owner==='you'?`You already booked ${room} on ${human(date)}. Use Change under Your bookings to edit this reservation.`:`${room} is already reserved on ${human(date)}. Choose an available date.`);return;}setSlotError('');setForm({roomNumber:room,startDate:date,endDate:addDays(date,1),purpose:''});setEditing(null);setError('');document.getElementById('booking-form')?.scrollIntoView({behavior:'smooth',block:'nearest'});}
 function rangeDates(selection){const startDate=selection.anchor<selection.end?selection.anchor:selection.end;const lastDate=selection.anchor>selection.end?selection.anchor:selection.end;return {startDate,endDate:addDays(lastDate,1)};}
 function rangeConflict(selection){const range=rangeDates(selection);return bookings.some(b=>b.roomNumber===selection.room&&range.startDate<b.endDate&&range.endDate>b.startDate);}
 function startRange(e,room,day){if(e.button!==0||!e.isPrimary)return;if(occupied(room,day)){pick(room,day);return;}e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);const selection={room,anchor:day,end:day,pointerId:e.pointerId};dragRef.current=selection;setDrag(selection);setSlotError('');}
 function moveRange(e){const selection=dragRef.current;if(!selection||selection.pointerId!==e.pointerId)return;const cell=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-slot-date]');if(cell?.dataset.slotRoom!==selection.room)return;const next={...selection,end:cell.dataset.slotDate};dragRef.current=next;setDrag(next);}
 function finishRange(e){if(!dragRef.current||dragRef.current.pointerId!==e.pointerId)return;moveRange(e);const selection=dragRef.current;dragRef.current=null;setDrag(null);if(rangeConflict(selection)){setSlotError('This range includes reserved dates. Choose a continuous range of available days.');return;}const dates=rangeDates(selection);setForm({roomNumber:selection.room,...dates,purpose:''});setEditing(null);setError('');setNotice(`Selected ${human(dates.startDate)} to ${human(addDays(dates.endDate,-1))}. End date is ${human(dates.endDate)} (exclusive).`);setSlotError('');}
 function cancelRange(){dragRef.current=null;setDrag(null);}
 const preview=drag?{roomNumber:drag.room,...rangeDates(drag)}:form;
 const invalidPreview=drag&&rangeConflict(drag);
 function edit(row){if(row.owner!=='you')return;cancelRange();setView(row.roomNumber);setBuilding(row.roomNumber[0]);const day=new Date(`${row.startDate}T12:00:00Z`).getUTCDay();setWeek(addDays(row.startDate,-((day+6)%7)));setSlotError('');setTab('Availability');document.getElementById('availability-calendar')?.scrollIntoView({behavior:'smooth',block:'start'});setEditing(row.id);setForm({roomNumber:row.roomNumber,startDate:row.startDate,endDate:row.endDate,purpose:row.purpose});setError('');setNotice('');}
 function submit(e){e.preventDefault();setNotice('');const err=issue(form,bookings,editing);if(err){setError('Reservation failed. Review the selected dates.');return;}const payload={roomNumber:form.roomNumber.trim(),startDate:form.startDate,endDate:form.endDate,purpose:form.purpose.trim(),owner:'you'};
 if(editing){setBookings(bookings.map(b=>b.id===editing?{...b,...payload}:b));setNotice('Booking updated.');}else{setBookings([...bookings,{...payload,id:'b-'+Date.now()}]);setNotice('Room reserved.');}setForm({...formEmpty});setEditing(null);setError('');}
 function reset(){setBookings(seed);setForm({...formEmpty});setEditing(null);setWeek('2026-11-09');setNotice('Example bookings restored.');setError('');setView('');setBuilding('');setSlotError('');}
 function check(){setNotice('');setError('');let e=issue(form,bookings,editing);if(e){setError(e);}else setNotice('No conflict detected for the selected dates.');}
 return <div className="room-app"><header className="topbar"><div className="mark"><span className="mark-sq">R</span><span><strong>room<span>grid</span></strong><small>Campus spaces</small></span></div><nav><button className={tab==='Availability'?'selected':''} onClick={()=>setTab('Availability')}>Availability</button><button className={tab==='My bookings'?'selected':''} onClick={()=>{setTab('My bookings');document.getElementById('my-reservations')?.scrollIntoView({behavior:'smooth'});}}>My bookings</button><button onClick={reset}>Reset demo</button></nav><div className="member"><span>Student dashboard</span><div className="profile">YOU</div></div></header>
  <main><section className="intro"><div><span className="eyebrow">SPACES / RESERVATIONS</span><h1>Find room availability</h1><p>Review campus rooms, dates and existing reservations in one view.</p></div></section>
   <div className="pagegrid"><section className="calendar-pane" id="availability-calendar"><div className="calendar-head"><div><span className="eyebrow">AVAILABILITY CALENDAR</span><h2>{view?`Availability for ${view}`:'Choose a room'}</h2></div>{view&&<div className="weeknav"><button aria-label="Previous week" onClick={()=>{setWeek(addDays(week,-7));setSlotError('');}}>←</button><strong>{human(week)} – {human(addDays(week,6))}</strong><button aria-label="Next week" onClick={()=>{setWeek(addDays(week,7));setSlotError('');}}>→</button></div>}</div>
    <div className="room-filters"><label htmlFor="building-filter">Building<select id="building-filter" value={building} onChange={e=>{cancelRange();setBuilding(e.target.value);setView('');setSlotError('');}}><option value="">Select a building...</option>{buildings.map(b=><option key={b} value={b}>Building {b}</option>)}</select></label><label htmlFor="room-filter">Room<select id="room-filter" value={view} disabled={!building} onChange={e=>{cancelRange();setView(e.target.value);setSlotError('');}} aria-describedby="room-filter-hint"><option value="">{building?'Select a room...':'Choose a building first'}</option>{buildingRooms.map(room=><option key={room} value={room}>{room}</option>)}</select></label></div>
    <p id="room-filter-hint" className="room-filter-hint">{building?`Choose a room in Building ${building} to view its availability.`:'Start by choosing a building, then choose a room.'}</p>
    {view&&<div className="calendar-controls"><span className="legend"><i className="booked"/> Reserved</span><span className="legend"><i className="free"/> Available</span><span className="legend"><i className="mine"/> My booking</span><p>Click or drag across available days to select dates.</p></div>}
    {slotError&&<div className="error" role="alert">{slotError}</div>}
    {view?<><div className="calendar-scroll"><div className="room-cal"><div className="corner">ROOM / DATE</div>{days.map(d=><div className="dayhead" key={d}><strong>{weekDay(d)}</strong><span>{human(d)}</span></div>)}{roomList.map((room,i)=><React.Fragment key={room}><div className="roomname"><strong>{room}</strong><small>Study room · {room[0]}</small></div>{days.map(day=>{const b=occupied(room,day);const isMine=b?.owner==='you';const status=isMine?'My booking':b?'Reserved':'Available';const selected=preview.roomNumber===room&&day>=preview.startDate&&day<preview.endDate;return <button key={room+day} title={`${room}, ${day}: ${status}`} className={'slot '+(isMine?'mine':b?'taken':'available')+(selected?(invalidPreview?' range-invalid':' range-selected'):'')} data-slot-date={day} data-slot-room={room} aria-pressed={selected} onPointerDown={e=>startRange(e,room,day)} onPointerMove={moveRange} onPointerUp={finishRange} onPointerCancel={cancelRange} onLostPointerCapture={cancelRange} onClick={e=>{if(e.detail===0)pick(room,day);}}><span>{status}</span></button>})}</React.Fragment>)}</div></div>
    <p className="calendar-note">Drag in either direction to select consecutive days, then release to fill the booking form. All highlighted days are included; the end date is the following day (exclusive).</p></>:<div className="calendar-empty"><strong>Choose a room to view its availability.</strong><p>Select a building, then a room above to see its available dates.</p></div>}
    <section id="my-reservations" className="reservations"><div className="reservations-head"><h2>Your bookings</h2><span>{myBookings.length} current records</span></div><div className="reservations-list">{myBookings.map(b=><article key={b.id} className="reservation"><div className="room-chip">{b.roomNumber}</div><div className="reservation-body"><strong>{human(b.startDate)} – {human(b.endDate)}</strong><small>{b.purpose||'No purpose entered'}</small></div><button onClick={()=>edit(b)}>Change</button></article>)}{myBookings.length===0&&<p>No reservations.</p>}</div></section></section>
    <aside className="booking-pane" id="booking-form"><div className="panel-tag"><span>BOOK A ROOM</span><span>FORM 01</span></div><h2>{editing?'Change reservation':'Make a reservation'}</h2><p className="booking-description">Use this panel to request a room for your study group, meeting or activity.</p>{notice&&<div className="success" role="status">{notice}</div>}{error&&<div className="error" role="alert">{error}</div>}<form onSubmit={submit}><label><span>Room number</span><input list="rooms" placeholder="e.g., B2-104" value={form.roomNumber} onChange={e=>setForm(f=>({...f,roomNumber:e.target.value}))}/><datalist id="rooms">{rooms.map(r=><option key={r} value={r}/>)}</datalist></label><div className="date-pair"><label><span>Start date</span><input type="date" value={form.startDate} onChange={e=>setForm(f=>({...f,startDate:e.target.value}))}/></label><label><span>End date</span><input type="date" value={form.endDate} onChange={e=>setForm(f=>({...f,endDate:e.target.value}))}/></label></div><label><span>Purpose / optional</span><textarea rows="5" placeholder="Meeting, group study..." value={form.purpose} onChange={e=>setForm(f=>({...f,purpose:e.target.value}))}/></label><p className="helper">Start and end dates are required. Reservations cannot overlap existing bookings for the same room.</p><button className="availability-check" type="button" onClick={check}>Check availability</button><button className="reserve-button" type="submit">{editing?'Save booking':'Confirm booking'}</button>{editing&&<button className="cancel-edit" type="button" onClick={()=>{if(window.confirm('Are you sure you want to cancel this booking')){setEditing(null);setForm({...formEmpty});setError('');setNotice('');}}}>Cancel booking</button>}</form><div className="right-foot"><span>✦</span> Need a room for a group? Find an open date and submit your request.</div></aside></div>
  </main><footer>ROOMGRID / Academic campus demo — local browser data only.</footer>
 </div>;
}
