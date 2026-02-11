
export const getWeekRange = (dateString: string) => {
  const date = new Date(dateString);
  const day = date.getDay(); // 0 (Sun) to 6 (Sat)
  
  const diffToSun = day;
  const sun = new Date(date);
  sun.setDate(date.getDate() - diffToSun);
  
  const sat = new Date(sun);
  sat.setDate(sun.getDate() + 6);
  
  return {
    start: sun.toISOString().split('T')[0],
    end: sat.toISOString().split('T')[0]
  };
};

export const getDayLabel = (dateString: string) => {
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  const date = new Date(dateString);
  return `${days[date.getDay()]} (${date.getDate()})`;
};
