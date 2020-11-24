
function counter(time) {
  let count = time
  while(count > 0){
    count--
    setTimeout(() => {
      console.log(count)
    }, 1000);
  } 
}

counter(55);