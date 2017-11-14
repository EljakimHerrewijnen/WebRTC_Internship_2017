using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using WebRTC_Internship.Models;
using System.Linq;
using Microsoft.EntityFrameworkCore;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace WebRTC_Internship.Controllers
{
    [RequireHttps]
    [Route("api/[controller]/")]
    public class VideochatController : Controller
    {
        DbContextOptionsBuilder optionsBuilder = new DbContextOptionsBuilder<secondcontext>();
        VideochatDBContext db = new VideochatDBContext();
        // GET: api/videochat
        [HttpGet]
        public IActionResult Videochat()
        {
            return View();
            //Videochat videochat = db.Videochats.Find(1);
        }
        
        [HttpGet("start_chat")]
        public IActionResult Start_chat()
        {
            string uuid = Guid.NewGuid().ToString();
            var videochat =  new Models.Videochat { UUID = "123", Start = DateTime.Now, End = DateTime.Now };
            foreach(Videochat video in db.Videochat)
            {
                Console.WriteLine(video.ToString());
            }
            //second.Videochat.Add(videochat);
            db.Add(videochat);
            db.SaveChanges();
            db.Videochat.Add(videochat);
            if (ModelState.IsValid)
            {
            }
            return Redirect("/api/videochat/" + uuid);
        }

        [RequireHttps]
        [HttpGet("{uuid}")]
        public IActionResult Join_chat(string uuid)
        {
            return View();
        }
        
        // POST api/videochat
        [HttpPost]
        public void Post([FromBody]string value)
        {
        }

        // PUT api/values/5
        [HttpPut("{id}")]
        public void Put(int id, [FromBody]string value)
        {
        }

        // DELETE api/values/5
        [HttpDelete("{id}")]
        public void Delete(int id)
        {
        }
    }
}
