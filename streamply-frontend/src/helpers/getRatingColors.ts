
  export const getRatingColor = (rating: number) => {
    switch (true) {
      case rating >= 1 && rating < 3:
        return 'red';
      case rating >= 3 && rating < 5:
        return 'orange';
      case rating >= 5 && rating < 7:
        return 'yellow';
      case rating >= 7 && rating < 9:
        return 'lightgreen';
      case rating >= 9 && rating <= 10:
        return 'green';
      default:
        return 'white';
    }
  }