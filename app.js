const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Update the following line with your MongoDB Atlas connection string
const atlasUri = 'mongodb+srv://CicranCranci:Spike2005.@atlascluster.kqyouqs.mongodb.net/todolistDB';

// Update the connection options as needed
const connectionOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

mongoose.connect(atlasUri, connectionOptions)
  .then(() => {
    console.log('Connected to MongoDB Atlas');
    // Start the server once the connection is established
    app.listen(3000, function () {
      console.log("Server started on port 3000");
    });
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB Atlas:', error);
  });

const itemsSchema = {
    name: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to your todolist!"
});

const item2 = new Item({
    name: "Hit the + button to add a new item."
});

const item3 = new Item({
    name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
    List.find({})
        .then(function (foundLists) {
            if (foundLists.length === 0) {
                // If there are no lists, create the default list with default items
                const list = new List({
                    name: "Today",
                    items: defaultItems
                });
                return list.save();
            } else {
                return foundLists[0];
            }
        })
        .then(function (defaultList) {
            // Retrieve the items from the default list
            const items = defaultList.items;
            res.render("list", { listTitle: defaultList.name, newListItems: items, lists: [] });
        })
        .catch(function (err) {
            console.log(err);
        });
});


app.get("/:customListName", function (req, res) {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({ name: customListName })
        .then(function (foundList) {
            if (!foundList) {
                // Create a new list
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                return list.save();
            } else {
                // Show an existing list
                return Promise.resolve(foundList);
            }
        })
        .then(function (foundList) {
            List.find({})
                .then(function (foundLists) {
                    res.render("list", { listTitle: foundList.name, newListItems: foundList.items, lists: foundLists });
                })
                .catch(function (err) {
                    console.log(err);
                    res.redirect("/");
                });
        })
        .catch(function (err) {
            console.log(err);
            res.redirect("/");
        });
});


app.post("/", function (req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    if (listName === "Today") {
        item.save()
            .then(function () {
                res.redirect("/");
            })
            .catch(function (err) {
                console.log(err);
            });
    } else {
        List.findOne({ name: listName })
            .then(function (foundList) {
                foundList.items.push(item);
                return foundList.save();
            })
            .then(function () {
                res.redirect("/" + listName);
            })
            .catch(function (err) {
                console.log(err);
            });
    }
});

app.post("/delete", function (req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
        Item.findOneAndDelete({ _id: checkedItemId })
            .then(function () {
                console.log("Successfully deleted checked item.");
                res.redirect("/");
            })
            .catch(function (err) {
                console.log(err);
            });
    } else {
        List.findOneAndUpdate(
            { name: listName },
            { $pull: { items: { _id: checkedItemId } } }
        )
            .then(function () {
                res.redirect("/" + listName);
            })
            .catch(function (err) {
                console.log(err);
            });
    }
});
