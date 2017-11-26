package com.opticdev.core.sourcegear

import better.files.File
import com.opticdev.core.Fixture.AkkaTestFixture
import com.opticdev.core.Fixture.compilerUtils.GearUtils
import com.opticdev.core.sourcegear.project.{Project, StaticSGProject}
import com.opticdev.parsers.{ParserBase, SourceParserManager}

/*
//@todo INCOMPLETE TESTS. NEED TO DO SOME SERIOUS WORK ON THE SUITE
 */

class SourceGearTest extends AkkaTestFixture("SourceGearTest") with GearUtils {

  describe("SourceGear") {

    val sourceGear = new SourceGear {
      override val parsers: Set[ParserBase] = SourceParserManager.installedParsers
      override val gearSet = new GearSet()
      override val schemas = Set()
    }

    implicit val project = new StaticSGProject("test", File(getCurrentDirectory + "/test-examples/resources/example_source/"), sourceGear)

    it("Finds matches in a test file.") {

      val importGear = gearFromDescription("test-examples/resources/example_packages/optic:ImportExample@0.1.0.json")

      sourceGear.gearSet.addGear(importGear)

      val testFilePath = getCurrentDirectory + "/test-examples/resources/example_source/ImportSource.js"
      val results = sourceGear.parseFile(File(testFilePath))

      assert(results.get.modelNodes.size == 2)

    }

  }

}