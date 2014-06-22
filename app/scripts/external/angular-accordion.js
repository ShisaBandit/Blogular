function MessageCenterCtrl($scope) {

  $scope.items = ['Item 1'];

  $scope.addItem = function() {
    var newItemNo = $scope.items.length + 1;
    $scope.items.push('Item ' + newItemNo);
  };

}