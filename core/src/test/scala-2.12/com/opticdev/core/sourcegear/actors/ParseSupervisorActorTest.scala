package com.opticdev.sourcegear.actors

import better.files.File
import com.opticdev.core.Fixture.AkkaTestFixture
import com.opticdev.core.sourcegear.graph.FileNode
import com.opticdev.core.sourcegear.project.{Project, StaticSGProject}
import com.opticdev.core.sourcegear._
import com.opticdev.parsers.{ParserBase, SourceParserManager}
import com.opticdev.core.actorSystem
import com.opticdev.core.sourcegear.actors._

import scalax.collection.mutable.Graph

class ParseSupervisorActorTest extends AkkaTestFixture("ParseSupervisorActorTest") {

  override def beforeAll {
    resetScratch
  }

  def fixture = new {
    val actorCluster = new ActorCluster(system)
  }

  describe("Parse supervisor actor") {

    implicit val sourceGear = new SourceGear {
      override val parsers: Set[ParserBase] = SourceParserManager.installedParsers
      override val gearSet = new GearSet()
      override val schemas = Set()
    }

    describe("context lookup") {
      val f = fixture
      implicit val logToCli = false

      implicit val project = new StaticSGProject("test", File(getCurrentDirectory + "/test-examples/resources/example_source/"), sourceGear) {
        override val projectActor = f.actorCluster.newProjectActor()
      }

      it("for file in cache") {
        val file = File(getCurrentDirectory+"test-examples/resources/tmp/test_project/app.js")
        f.actorCluster.parserSupervisorRef ! AddToCache(FileNode.fromFile(file), Graph(), SourceParserManager.installedParsers.head, "Contents")
        f.actorCluster.parserSupervisorRef ! GetContext(FileNode.fromFile(file))(sourceGear, project)
        expectMsg(Option(SGContext(sourceGear.fileAccumulator, Graph(), SourceParserManager.installedParsers.head, "Contents")))
      }

      it("for file not in cache") {
        val file = File(getCurrentDirectory+"test-examples/resources/tmp/test_project/app.js")
        f.actorCluster.parserSupervisorRef ! ClearCache
        f.actorCluster.parserSupervisorRef ! GetContext(FileNode.fromFile(file))(sourceGear, project)
        expectMsgPF() {
          case a: Option[SGContext] => assert(a.isDefined)
        }
      }

    }

    implicit val project = new StaticSGProject("test", File(getCurrentDirectory + "/test-examples/resources/example_source/"), sourceGear) {
      override val projectActor = self
    }

    it("can parse files") {
      actorCluster.parserSupervisorRef ! ParseFile(File(getCurrentDirectory+"test-examples/resources/test_project/app.js"), self, project)
      expectMsgAllConformingOf[ParseSuccessful]()
      expectMsgPF() {
        case ps: ParseSuccessful => assert(ps.parseResults.astGraph.nonEmpty)
      }
    }

    it("fails gracefully when file is unreadable") {
      actorCluster.parserSupervisorRef ! ParseFile(File(getCurrentDirectory+"test-examples/resources/test_project/fakeFile.js"), self, project)
      expectMsg(ParseFailed(File(getCurrentDirectory+"test-examples/resources/test_project/fakeFile.js")))
    }

    describe("caches") {
      val dummyRecord = CacheRecord(Graph(), null, "contents")
      val file = FileNode.fromFile(File("test-examples/resources/tmp/test_project/app.js"))
      val parseCache = new ParseCache
      parseCache.add(file, dummyRecord)

      it("can be assigned") {
        ParseSupervisorSyncAccess.setCache(parseCache)
        assert(ParseSupervisorSyncAccess.cacheSize == 1)
      }

      it("can be cleared") {
        actorCluster.parserSupervisorRef ! ClearCache
        assert(ParseSupervisorSyncAccess.cacheSize == 0)
      }

      it("can add records") {
        actorCluster.parserSupervisorRef ! ClearCache
        actorCluster.parserSupervisorRef ! AddToCache(file, Graph(), null, "contents")
        assert(ParseSupervisorSyncAccess.cacheSize == 1)
      }

      it("can lookup records") {
        assert(ParseSupervisorSyncAccess.lookup(file).isDefined)
      }

    }

  }

}