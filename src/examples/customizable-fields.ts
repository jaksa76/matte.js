import { boolean, date, number, ownedEntity, string } from "../framework";

// customizing how fields are displayed
const Person = ownedEntity("Person", [
  string("firstName"),
  string("lastName"),
  number("age"),
  date("birthDate"),
  boolean("isActive"),
]);