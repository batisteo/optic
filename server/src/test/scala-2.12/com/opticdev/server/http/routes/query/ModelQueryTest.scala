package com.opticdev.server.http.routes.query

import org.scalatest.FunSpec
import play.api.libs.json.{JsString, Json}

class ModelQueryTest extends FunSpec {
  describe("Model query") {

    it("parses from json") {
      val json = Json.parse("""{"file": {"rule": "Any"}, "predicates": [{ "key": "prop.prop1", "op": "!=", "value": "Hello!" }]}""")
      assert(ModelQuery.fromJson(json) ==
      ModelQuery(AnyFile, Vector(
        NotEqual(Seq("prop", "prop1"), JsString("Hello!"))
      )))
    }

    it("fails to parse when invalid input") {
      val json = Json.parse("""{"file": false, "extraField": "45"}""")
      assertThrows[Error] {
        ModelQuery.fromJson(json)
      }
    }

  }
}
