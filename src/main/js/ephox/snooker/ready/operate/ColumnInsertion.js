define(
  'ephox.snooker.ready.operate.ColumnInsertion',

  [
    'ephox.compass.Arr',
    'ephox.highway.Merger',
    'ephox.peanut.Fun',
    'ephox.perhaps.Option',
    'ephox.snooker.ready.lookup.Blocks'
  ],

  function (Arr, Merger, Fun, Option, Blocks) {
    var operate = function (warehouse, rowIndex, colIndex, operation) {
      /* 
         The process:

         Identify which cell has selection focus
         Work out the real column of that cell
         Find all the cells on that column
         Apply operation
       */

      var cells = warehouse.all();
      var initial = Option.from(cells[rowIndex]).bind(function (row) {
        return Option.from(row.cells()[colIndex]);
      });

      return initial.map(function (start) {
        var column = Blocks.column(warehouse, start.column());
        return Arr.map(column, function (context, i) {
          var before = context.before();
          var after = context.after();
          var on = operation(context.on());

          var resultant = context.before().concat(on).concat(context.after());
          return {
            cells: Fun.constant(resultant),
            element: context.row
          };
        });
      }).getOrThunk(function () {
        return warehouse.all();
      });
    };

    var adjust = function (cell, delta) {
      return Merger.merge(cell, {
        colspan: Fun.constant(cell.colspan() + delta)
      });
    };

    var insertAfter = function (warehouse, rowIndex, colIndex, nu) {
      var operation = function (on) {
        return on.fold(function () {
          return [];
        }, function (whole) {
          return [ whole, nu(whole) ];
        }, function (partial, offset) {
          return offset < partial.colspan() - 1 ? [ adjust(partial, 1) ] : [ partial, nu(partial) ];
        });
      };

      return operate(warehouse, rowIndex, colIndex, operation);
    };

    var insertBefore = function (warehouse, rowIndex, colIndex, nu) {
      var operation = function (on) {
        return on.fold(function () {
          return [];
        }, function (whole) {
          return [ nu(whole), whole ];
        }, function (partial, offset) {
          return offset === 0 ? [ nu(partial), partial ] : [ adjust(partial, 1) ];
        });
      };

      return operate(warehouse, rowIndex, colIndex, operation);
    };

    // Should this really be in a module called Insertion?
    var erase = function (warehouse, rowIndex, colIndex) {
      var operation = function (on) {
        return on.fold(function () {
          return [];
        }, function (whole) {
          return [];
        }, function (partial, offset) {
          return [ adjust(partial, -1) ];
        });
      };

      return operate(warehouse, rowIndex, colIndex, operation);
    };

    return {
      insertAfter: insertAfter,
      insertBefore: insertBefore,
      erase: erase
    };
  }
);
